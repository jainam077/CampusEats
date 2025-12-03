"""Reviews endpoints - connects to Supabase 'review' and 'photo' tables."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form

from app.db.supabase import get_supabase
from app.core.config import settings
from app.core.auth import get_current_user_id

router = APIRouter()


@router.get("/dish/{dish_id}")
async def get_dish_reviews(
    dish_id: int,
    limit: int = Query(20, le=50),
    offset: int = Query(0),
):
    """Get all reviews for a dish with photos."""
    supabase = get_supabase()
    
    # Get reviews with user info
    reviews_result = supabase.table("review").select(
        "*, user(user_id, name)"
    ).eq("dish_id", dish_id).order(
        "created_at", desc=True
    ).range(offset, offset + limit - 1).execute()
    
    # Get photos for each review
    reviews = []
    for review in reviews_result.data:
        photos_result = supabase.table("photo").select("*").eq(
            "review_id", review["review_id"]
        ).execute()
        review["photos"] = photos_result.data
        reviews.append(review)
    
    return {"reviews": reviews, "total": len(reviews)}


@router.post("")
async def create_review(
    dish_id: int = Form(...),
    rating: int = Form(..., ge=1, le=5),
    text_review: Optional[str] = Form(None),
):
    """Create a new review for a dish."""
    supabase = get_supabase()
    
    # Get user (mock for demo)
    user_id = settings.MOCK_USER_ID if settings.MOCK_AUTH_ENABLED else 1
    
    # Create review
    result = supabase.table("review").insert({
        "user_id": user_id,
        "dish_id": dish_id,
        "rating": rating,
        "text_review": text_review,
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create review")
    
    return result.data[0]


@router.get("/{review_id}")
async def get_review(review_id: int):
    """Get a specific review with photos."""
    supabase = get_supabase()
    
    # Get review with user info
    result = supabase.table("review").select(
        "*, user(user_id, name)"
    ).eq("review_id", review_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review = result.data[0]
    
    # Get photos
    photos_result = supabase.table("photo").select("*").eq(
        "review_id", review_id
    ).execute()
    review["photos"] = photos_result.data
    
    return review


@router.delete("/{review_id}")
async def delete_review(review_id: int):
    """Delete a review (owner only in production)."""
    supabase = get_supabase()
    
    # Check exists
    result = supabase.table("review").select("review_id").eq(
        "review_id", review_id
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Delete (in production, check ownership)
    supabase.table("review").delete().eq("review_id", review_id).execute()
    
    return {"deleted": True, "review_id": review_id}
