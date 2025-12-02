"""Dishes endpoints - connects to Supabase 'dish' table."""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query

from app.db.supabase import get_supabase

router = APIRouter()


@router.get("")
async def list_dishes(
    venue_id: Optional[int] = Query(None, description="Filter by venue ID"),
    search: Optional[str] = Query(None, description="Search by dish name"),
    dietary: Optional[str] = Query(None, description="Filter by dietary tags (comma-separated)"),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
):
    """
    List all dishes with optional filters.
    """
    supabase = get_supabase()
    
    query = supabase.table("dish").select("*")
    
    # Apply search filter
    if search:
        query = query.ilike("name", f"%{search}%")
    
    # Apply dietary filter
    if dietary:
        # Filter dishes that contain any of the dietary tags
        dietary_list = [d.strip() for d in dietary.split(",")]
        for tag in dietary_list:
            query = query.contains("dietary_tags", [tag])
    
    # Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    result = query.execute()
    
    return {
        "dishes": result.data,
        "total": len(result.data),
        "offset": offset,
        "limit": limit
    }


@router.get("/{dish_id}")
async def get_dish(dish_id: int):
    """Get a specific dish by ID with its reviews."""
    supabase = get_supabase()
    
    # Get dish
    result = supabase.table("dish").select("*").eq("dish_id", dish_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Dish not found")
    
    dish = result.data[0]
    
    # Get reviews for this dish
    reviews_result = supabase.table("review").select("*").eq("dish_id", dish_id).order("created_at", desc=True).limit(10).execute()
    
    # Calculate average rating
    if reviews_result.data:
        ratings = [r["rating"] for r in reviews_result.data if r.get("rating")]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
    else:
        avg_rating = None
    
    return {
        **dish,
        "reviews": reviews_result.data,
        "avg_rating": round(avg_rating, 1) if avg_rating else None,
        "review_count": len(reviews_result.data)
    }


@router.get("/{dish_id}/nutrition")
async def get_dish_nutrition(dish_id: int):
    """Get nutritional information for a dish."""
    supabase = get_supabase()
    
    result = supabase.table("dish").select(
        "dish_id, name, calories, protein, carbs, fat, fiber, sodium, sugar, serving_size"
    ).eq("dish_id", dish_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Dish not found")
    
    return result.data[0]
