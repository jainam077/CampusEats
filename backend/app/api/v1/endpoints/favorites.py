"""Favorites endpoints - manage user's favorite dishes and venues."""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.db.supabase import get_supabase
from app.core.config import settings

router = APIRouter()


class FavoriteCreate(BaseModel):
    """Request model for adding a favorite."""
    item_type: str  # "dish" or "venue"
    item_id: int


class FavoriteResponse(BaseModel):
    """Response model for a favorite."""
    id: int
    user_id: int
    item_type: str
    item_id: int
    created_at: str


@router.get("")
async def get_favorites(
    user_id: int = Query(..., description="User ID"),
    item_type: Optional[str] = Query(None, description="Filter by type: 'dish' or 'venue'")
):
    """Get user's favorites with full item details."""
    supabase = get_supabase()
    
    query = supabase.table("favorite").select("*").eq("user_id", user_id)
    
    if item_type:
        query = query.eq("item_type", item_type)
    
    result = query.order("created_at", desc=True).execute()
    favorites = result.data or []
    
    # Enrich with item details
    enriched = []
    for fav in favorites:
        item_data = None
        if fav["item_type"] == "dish":
            dish_result = supabase.table("dish").select("*").eq("dish_id", fav["item_id"]).execute()
            if dish_result.data:
                item_data = dish_result.data[0]
        elif fav["item_type"] == "venue":
            venue_result = supabase.table("venue").select("*").eq("venue_id", fav["item_id"]).execute()
            if venue_result.data:
                item_data = venue_result.data[0]
        
        enriched.append({
            **fav,
            "item": item_data
        })
    
    return {
        "favorites": enriched,
        "total": len(enriched)
    }


@router.post("")
async def add_favorite(favorite: FavoriteCreate, user_id: int = Query(...)):
    """Add a dish or venue to user's favorites."""
    supabase = get_supabase()
    
    # Validate item_type
    if favorite.item_type not in ["dish", "venue"]:
        raise HTTPException(status_code=400, detail="item_type must be 'dish' or 'venue'")
    
    # Check if already favorited
    existing = supabase.table("favorite").select("id").eq("user_id", user_id).eq(
        "item_type", favorite.item_type
    ).eq("item_id", favorite.item_id).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    # Verify item exists
    if favorite.item_type == "dish":
        item = supabase.table("dish").select("dish_id").eq("dish_id", favorite.item_id).execute()
    else:
        item = supabase.table("venue").select("venue_id").eq("venue_id", favorite.item_id).execute()
    
    if not item.data:
        raise HTTPException(status_code=404, detail=f"{favorite.item_type.capitalize()} not found")
    
    # Add favorite
    result = supabase.table("favorite").insert({
        "user_id": user_id,
        "item_type": favorite.item_type,
        "item_id": favorite.item_id
    }).execute()
    
    return {
        "message": "Added to favorites",
        "favorite": result.data[0] if result.data else None
    }


@router.delete("/{favorite_id}")
async def remove_favorite(favorite_id: int, user_id: int = Query(...)):
    """Remove an item from favorites."""
    supabase = get_supabase()
    
    # Check ownership
    existing = supabase.table("favorite").select("*").eq("id", favorite_id).execute()
    
    if not existing.data:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    if existing.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    supabase.table("favorite").delete().eq("id", favorite_id).execute()
    
    return {"message": "Removed from favorites"}


@router.delete("")
async def remove_favorite_by_item(
    user_id: int = Query(...),
    item_type: str = Query(...),
    item_id: int = Query(...)
):
    """Remove a favorite by item type and ID."""
    supabase = get_supabase()
    
    result = supabase.table("favorite").delete().eq("user_id", user_id).eq(
        "item_type", item_type
    ).eq("item_id", item_id).execute()
    
    return {"message": "Removed from favorites"}


@router.get("/check")
async def check_favorite(
    user_id: int = Query(...),
    item_type: str = Query(...),
    item_id: int = Query(...)
):
    """Check if an item is in user's favorites."""
    supabase = get_supabase()
    
    result = supabase.table("favorite").select("id").eq("user_id", user_id).eq(
        "item_type", item_type
    ).eq("item_id", item_id).execute()
    
    return {
        "is_favorite": len(result.data) > 0,
        "favorite_id": result.data[0]["id"] if result.data else None
    }
