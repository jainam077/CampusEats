"""
Admin endpoints for Campus Eats
Includes scraper management and data maintenance
"""

from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel

from app.db.supabase import get_supabase
from app.services import NutrisliceScraper, run_scraper, GSU_SCHOOLS

router = APIRouter(prefix="/admin", tags=["admin"])


class ScrapeRequest(BaseModel):
    """Request model for scraping"""
    venue_id: Optional[int] = None  # If None, scrape all venues
    days_ahead: int = 7  # How many days to scrape


class ScrapeResponse(BaseModel):
    """Response model for scrape operation"""
    status: str
    message: str
    venues_processed: int = 0
    dishes_added: int = 0
    menus_created: int = 0


class DataStats(BaseModel):
    """Database statistics"""
    total_venues: int
    total_dishes: int
    total_menus: int
    total_reviews: int
    total_users: int
    last_scrape: Optional[str] = None


# Background task storage (in production, use Redis or database)
scrape_status = {
    "running": False,
    "last_run": None,
    "last_result": None
}


@router.get("/health")
async def admin_health():
    """Admin health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "scraper_status": "running" if scrape_status["running"] else "idle"
    }


@router.get("/stats", response_model=DataStats)
async def get_stats():
    """Get database statistics"""
    supabase = get_supabase()
    
    try:
        # Get counts from each table
        venues = supabase.table("venue").select("id", count="exact").execute()
        dishes = supabase.table("dish").select("id", count="exact").execute()
        menus = supabase.table("menu").select("id", count="exact").execute()
        reviews = supabase.table("review").select("id", count="exact").execute()
        users = supabase.table("user").select("id", count="exact").execute()
        
        return DataStats(
            total_venues=venues.count or len(venues.data),
            total_dishes=dishes.count or len(dishes.data),
            total_menus=menus.count or len(menus.data),
            total_reviews=reviews.count or len(reviews.data),
            total_users=users.count or len(users.data),
            last_scrape=scrape_status.get("last_run")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/venues")
async def list_venues_for_scraping():
    """List all venues available for scraping"""
    supabase = get_supabase()
    
    venues = supabase.table("venue").select("*").execute()
    
    # Add Nutrislice school info
    nutrislice_venues = []
    for school_id, school_data in GSU_SCHOOLS.items():
        nutrislice_venues.append({
            "school_id": school_id,
            "name": school_data["name"],
            "menus": school_data["menus"]
        })
    
    return {
        "database_venues": venues.data,
        "nutrislice_venues": nutrislice_venues
    }


@router.post("/scrape", response_model=ScrapeResponse)
async def trigger_scrape(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger a scrape of Nutrislice data
    This runs in the background to avoid timeout
    """
    if scrape_status["running"]:
        raise HTTPException(
            status_code=409,
            detail="A scrape is already in progress"
        )
    
    # Mark as running
    scrape_status["running"] = True
    scrape_status["last_run"] = datetime.utcnow().isoformat()
    
    # Add background task
    background_tasks.add_task(
        run_scrape_task,
        venue_id=request.venue_id,
        days_ahead=request.days_ahead
    )
    
    return ScrapeResponse(
        status="started",
        message=f"Scrape initiated for {request.days_ahead} days ahead"
    )


async def run_scrape_task(venue_id: Optional[int] = None, days_ahead: int = 7):
    """Background task to run the scraper"""
    try:
        result = await run_scraper(days_ahead=days_ahead)
        scrape_status["last_result"] = result
    except Exception as e:
        scrape_status["last_result"] = {"error": str(e)}
    finally:
        scrape_status["running"] = False


@router.get("/scrape/status")
async def get_scrape_status():
    """Get the status of the last/current scrape"""
    return {
        "running": scrape_status["running"],
        "last_run": scrape_status["last_run"],
        "last_result": scrape_status["last_result"]
    }


@router.post("/sync-venues")
async def sync_venues():
    """
    Sync venues from Nutrislice configuration to database
    Creates venues if they don't exist
    """
    supabase = get_supabase()
    created = []
    updated = []
    
    for school_id, school_data in GSU_SCHOOLS.items():
        venue_name = school_data["name"]
        
        # Check if venue exists
        existing = supabase.table("venue").select("*").eq("name", venue_name).execute()
        
        if existing.data:
            # Update existing venue
            supabase.table("venue").update({
                "external_id": school_id,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", existing.data[0]["id"]).execute()
            updated.append(venue_name)
        else:
            # Create new venue
            new_venue = {
                "name": venue_name,
                "external_id": school_id,
                "description": f"GSU Dining - {venue_name}",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("venue").insert(new_venue).execute()
            created.append(venue_name)
    
    return {
        "status": "success",
        "created": created,
        "updated": updated
    }


@router.delete("/dishes/stale")
async def cleanup_stale_dishes(
    days_old: int = Query(default=30, description="Delete dishes not updated in this many days")
):
    """
    Remove dishes that haven't been served recently
    This helps keep the database clean
    """
    supabase = get_supabase()
    
    cutoff_date = (datetime.utcnow() - timedelta(days=days_old)).isoformat()
    
    # Get stale dishes (dishes not in any recent menu)
    # This is a simplified version - in production, would check menu_dish table
    stale = supabase.table("dish").select("id, name").lt("updated_at", cutoff_date).execute()
    
    count = len(stale.data) if stale.data else 0
    
    if count > 0:
        # Delete stale dishes
        for dish in stale.data:
            supabase.table("dish").delete().eq("id", dish["id"]).execute()
    
    return {
        "status": "success",
        "deleted_count": count,
        "cutoff_date": cutoff_date
    }


@router.post("/dishes/recalculate-ratings")
async def recalculate_ratings():
    """
    Recalculate average ratings for all dishes based on reviews
    """
    supabase = get_supabase()
    
    # Get all dishes
    dishes = supabase.table("dish").select("id").execute()
    updated_count = 0
    
    for dish in dishes.data:
        dish_id = dish["id"]
        
        # Get reviews for this dish
        reviews = supabase.table("review").select("rating").eq("dish_id", dish_id).execute()
        
        if reviews.data:
            avg_rating = sum(r["rating"] for r in reviews.data) / len(reviews.data)
            review_count = len(reviews.data)
            
            # Update dish
            supabase.table("dish").update({
                "avg_rating": round(avg_rating, 2),
                "review_count": review_count
            }).eq("id", dish_id).execute()
            
            updated_count += 1
    
    return {
        "status": "success",
        "dishes_updated": updated_count
    }


@router.get("/dietary-tags")
async def list_dietary_tags():
    """List all dietary tags in the system"""
    supabase = get_supabase()
    
    tags = supabase.table("dietary_tag").select("*").execute()
    
    return {
        "tags": tags.data,
        "count": len(tags.data) if tags.data else 0
    }


@router.post("/dietary-tags/sync")
async def sync_dietary_tags():
    """
    Sync dietary tags based on dish ingredients
    Analyzes dishes and creates/updates dietary tags
    """
    from app.services import analyze_dish_allergens
    
    supabase = get_supabase()
    
    # Get all dishes with ingredients
    dishes = supabase.table("dish").select("id, name, ingredients, description").execute()
    
    tags_created = 0
    
    for dish in dishes.data:
        if not dish.get("ingredients") and not dish.get("description"):
            continue
            
        # Analyze dish for dietary info
        text_to_analyze = f"{dish.get('ingredients', '')} {dish.get('description', '')}"
        allergens = analyze_dish_allergens(text_to_analyze)
        
        for allergen in allergens:
            # Check if tag exists
            existing = supabase.table("dietary_tag").select("id").eq(
                "dish_id", dish["id"]
            ).eq("tag_name", allergen).execute()
            
            if not existing.data:
                # Create tag
                supabase.table("dietary_tag").insert({
                    "dish_id": dish["id"],
                    "tag_name": allergen,
                    "created_at": datetime.utcnow().isoformat()
                }).execute()
                tags_created += 1
    
    return {
        "status": "success",
        "tags_created": tags_created
    }
