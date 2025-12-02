"""Recommendations endpoints - personalized dish recommendations."""

from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from app.db.supabase import get_supabase
from app.core.config import settings
from app.services import filter_dishes_by_dietary, get_dietary_matches
from app.services.llm_service import (
    generate_recommendation_explanation,
    natural_language_search,
    get_dietary_analysis,
    get_daily_meal_plan_advice,
)

router = APIRouter()


def get_deterministic_recommendations(
    supabase, 
    user_id: Optional[int] = None, 
    dietary_filters: List[str] = None,
    venue_id: Optional[int] = None
):
    """
    Generate deterministic recommendations based on:
    - User's past ratings/favorites
    - Dietary preferences
    - Overall dish popularity
    
    This ensures recommendations are never empty.
    """
    recommendations = []
    
    # Build query for dishes
    query = supabase.table("dish").select("*")
    
    # Filter by venue if specified
    if venue_id:
        # Get dish IDs from menu_dish for this venue's menus
        menus = supabase.table("menu").select("id").eq("venue_id", venue_id).execute()
        if menus.data:
            menu_ids = [m["id"] for m in menus.data]
            menu_dishes = supabase.table("menu_dish").select("dish_id").in_("menu_id", menu_ids).execute()
            if menu_dishes.data:
                dish_ids = list(set([md["dish_id"] for md in menu_dishes.data]))
                query = query.in_("dish_id", dish_ids[:50])  # Limit to 50 for performance
    
    result = query.limit(50).execute()
    dishes = result.data or []
    
    # Apply dietary filtering if specified
    if dietary_filters:
        dishes = filter_dishes_by_dietary(dishes, dietary_filters)
    
    # Get average ratings for dishes
    for dish in dishes:
        reviews_result = supabase.table("review").select("rating").eq(
            "dish_id", dish["dish_id"]
        ).execute()
        
        if reviews_result.data:
            ratings = [r["rating"] for r in reviews_result.data]
            avg_rating = sum(ratings) / len(ratings)
            review_count = len(ratings)
        else:
            avg_rating = 0
            review_count = 0
        
        # Calculate score
        score = avg_rating * 0.7 + min(review_count / 10, 1) * 0.3
        
        # Boost for dietary matches
        if dietary_filters:
            dietary_matches = get_dietary_matches(dish, dietary_filters)
            score += len(dietary_matches) * 0.1
        
        reason = "Popular dish" if review_count > 5 else "Try something new"
        if avg_rating >= 4:
            reason = "Highly rated"
        
        # Try to get AI-powered explanation if LLM is enabled
        if settings.LLM_ENABLED:
            try:
                reason = generate_recommendation_explanation(
                    dish=dish,
                    user_preferences=None,  # TODO: fetch user preferences
                    context=None
                )
            except Exception:
                pass  # Fall back to simple reason

        recommendations.append({
            "dish": dish,
            "score": round(score, 2),
            "reason": reason,
            "avg_rating": round(avg_rating, 1) if avg_rating else None,
            "review_count": review_count,
        })
    
    # Sort by score
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    return recommendations[:20]  # Return more for flexibility


@router.get("")
async def get_recommendations(
    user_id: Optional[int] = Query(None, description="User ID for personalized recs"),
    venue_id: Optional[int] = Query(None, description="Filter by venue"),
    dietary: Optional[str] = Query(None, description="Comma-separated dietary filters (vegetarian,vegan,gluten-free,halal,kosher)"),
    limit: int = Query(6, le=20),
):
    """
    Get personalized dish recommendations.
    
    Supports dietary filtering:
    - vegetarian: No meat/poultry/fish
    - vegan: No animal products
    - gluten-free: No gluten
    - halal: Halal-compliant
    - kosher: Kosher-compliant
    - dairy-free: No dairy
    - nut-free: No tree nuts or peanuts
    
    Falls back to deterministic heuristic if personalization unavailable.
    """
    supabase = get_supabase()
    
    # Use mock user if enabled
    if settings.MOCK_AUTH_ENABLED and not user_id:
        user_id = settings.MOCK_USER_ID
    
    dietary_filters = [d.strip() for d in dietary.split(",")] if dietary else []
    
    # Get recommendations
    recommendations = get_deterministic_recommendations(
        supabase, 
        user_id=user_id,
        dietary_filters=dietary_filters,
        venue_id=venue_id
    )
    
    return {
        "recommendations": recommendations[:limit],
        "user_id": user_id,
        "dietary_filters": dietary_filters,
        "is_personalized": user_id is not None,
        "fallback_used": True,  # Always using heuristic for now
    }


@router.get("/for-you")
async def get_for_you():
    """
    Get "Top Rated for You" recommendations.
    Uses mock user in demo mode.
    """
    supabase = get_supabase()
    user_id = settings.MOCK_USER_ID if settings.MOCK_AUTH_ENABLED else None
    
    recommendations = get_deterministic_recommendations(supabase, user_id=user_id)
    
    return {
        "title": "Top Rated for You",
        "recommendations": recommendations,
        "user_id": user_id,
    }


@router.get("/search")
async def natural_search(
    q: str = Query(..., description="Natural language search query"),
    venue_id: Optional[int] = Query(None, description="Filter by venue"),
    limit: int = Query(10, le=20),
):
    """
    Natural language search for dishes.
    
    Examples:
    - "something spicy and vegetarian"
    - "high protein breakfast"
    - "light lunch under 500 calories"
    - "comfort food for a cold day"
    
    Uses AI when LLM_ENABLED, otherwise falls back to keyword matching.
    """
    supabase = get_supabase()
    
    # Get available dishes
    query = supabase.table("dish").select("*")
    
    if venue_id:
        menus = supabase.table("menu").select("id").eq("venue_id", venue_id).execute()
        if menus.data:
            menu_ids = [m["id"] for m in menus.data]
            menu_dishes = supabase.table("menu_dish").select("dish_id").in_("menu_id", menu_ids).execute()
            if menu_dishes.data:
                dish_ids = list(set([md["dish_id"] for md in menu_dishes.data]))
                query = query.in_("dish_id", dish_ids[:100])
    
    result = query.limit(100).execute()
    available_dishes = result.data or []
    
    if not available_dishes:
        return {
            "query": q,
            "results": [],
            "message": "No dishes available to search",
            "llm_used": False,
        }
    
    # Use AI search or fallback
    matching_dishes = natural_language_search(q, available_dishes)
    
    return {
        "query": q,
        "results": matching_dishes[:limit],
        "count": len(matching_dishes),
        "llm_used": settings.LLM_ENABLED,
    }


@router.get("/analyze/{dish_id}")
async def analyze_dish_nutrition(
    dish_id: int,
    user_id: Optional[int] = Query(None, description="User ID for personalized analysis"),
):
    """
    Get AI-powered dietary analysis for a specific dish.
    
    Returns:
    - health_score: 0-100 score
    - summary: Brief nutritional summary
    - tips: Helpful eating tips
    - warnings: Any dietary warnings
    - pairings: Suggested food pairings
    """
    supabase = get_supabase()
    
    # Get dish
    result = supabase.table("dish").select("*").eq("dish_id", dish_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Dish not found")
    
    dish = result.data
    
    # Get user goals if available
    user_goals = None
    if user_id:
        prefs = supabase.table("user_preferences").select("*").eq("user_id", user_id).single().execute()
        if prefs.data:
            user_goals = {
                "calorie_goal": prefs.data.get("calorie_goal"),
                "protein_goal": prefs.data.get("protein_goal")
            }
    
    analysis = get_dietary_analysis(dish, user_goals)
    
    return {
        "dish_id": dish_id,
        "dish_name": dish.get("name"),
        **analysis
    }


@router.post("/analyze/meal")
async def analyze_meal_plan(
    dish_ids: List[int],
    user_id: Optional[int] = Query(None, description="User ID for personalized goals"),
):
    """
    Analyze a collection of dishes as a meal or daily meal plan.
    
    Returns:
    - totals: Combined nutrition totals
    - goals: User's daily goals
    - remaining: How much is left in the daily budget
    - recommendations: Personalized advice
    """
    supabase = get_supabase()
    
    # Get dishes
    result = supabase.table("dish").select("*").in_("dish_id", dish_ids).execute()
    dishes = result.data or []
    
    if not dishes:
        raise HTTPException(status_code=404, detail="No dishes found")
    
    # Get user goals if available
    user_goals = None
    if user_id:
        prefs = supabase.table("user_preferences").select("*").eq("user_id", user_id).single().execute()
        if prefs.data:
            user_goals = {
                "calorie_goal": prefs.data.get("calorie_goal", 2000),
                "protein_goal": prefs.data.get("protein_goal", 50)
            }
    
    analysis = get_daily_meal_plan_advice(dishes, user_goals)
    
    return {
        "dishes": [{"dish_id": d["dish_id"], "name": d.get("name")} for d in dishes],
        **analysis
    }

