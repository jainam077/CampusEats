"""User preferences endpoints - manage dietary preferences and settings."""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.db.supabase import get_supabase

router = APIRouter()


class UserPreferences(BaseModel):
    """User preferences model."""
    dietary_preferences: List[str] = []  # vegetarian, vegan, gluten-free, halal, kosher
    allergens: List[str] = []  # nuts, dairy, shellfish, etc.
    calorie_goal: Optional[int] = None
    protein_goal: Optional[int] = None
    favorite_cuisines: List[str] = []
    notifications_enabled: bool = True


class PreferencesUpdate(BaseModel):
    """Request model for updating preferences."""
    dietary_preferences: Optional[List[str]] = None
    allergens: Optional[List[str]] = None
    calorie_goal: Optional[int] = None
    protein_goal: Optional[int] = None
    favorite_cuisines: Optional[List[str]] = None
    notifications_enabled: Optional[bool] = None


@router.get("/{user_id}")
async def get_preferences(user_id: int):
    """Get user's preferences."""
    supabase = get_supabase()
    
    result = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
    
    if not result.data:
        # Return default preferences if none exist
        return UserPreferences().model_dump()
    
    return result.data[0]


@router.put("/{user_id}")
async def update_preferences(user_id: int, preferences: PreferencesUpdate):
    """Update user's preferences."""
    supabase = get_supabase()
    
    # Check if preferences exist
    existing = supabase.table("user_preferences").select("id").eq("user_id", user_id).execute()
    
    # Build update data (only non-None fields)
    update_data = {k: v for k, v in preferences.model_dump().items() if v is not None}
    update_data["user_id"] = user_id
    
    if existing.data:
        # Update existing
        result = supabase.table("user_preferences").update(update_data).eq("user_id", user_id).execute()
    else:
        # Insert new
        result = supabase.table("user_preferences").insert(update_data).execute()
    
    return {
        "message": "Preferences updated",
        "preferences": result.data[0] if result.data else update_data
    }


@router.patch("/{user_id}/dietary")
async def update_dietary_preferences(
    user_id: int,
    dietary_preferences: List[str] = Query(...)
):
    """Quick update for dietary preferences only."""
    supabase = get_supabase()
    
    # Validate dietary options
    valid_options = ["vegetarian", "vegan", "gluten-free", "halal", "kosher", "dairy-free", "nut-free"]
    for pref in dietary_preferences:
        if pref.lower() not in valid_options:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid dietary preference: {pref}. Valid options: {', '.join(valid_options)}"
            )
    
    existing = supabase.table("user_preferences").select("id").eq("user_id", user_id).execute()
    
    update_data = {
        "user_id": user_id,
        "dietary_preferences": [p.lower() for p in dietary_preferences]
    }
    
    if existing.data:
        result = supabase.table("user_preferences").update(update_data).eq("user_id", user_id).execute()
    else:
        result = supabase.table("user_preferences").insert(update_data).execute()
    
    return {
        "message": "Dietary preferences updated",
        "dietary_preferences": dietary_preferences
    }


@router.patch("/{user_id}/allergens")
async def update_allergens(
    user_id: int,
    allergens: List[str] = Query(...)
):
    """Quick update for allergens only."""
    supabase = get_supabase()
    
    existing = supabase.table("user_preferences").select("id").eq("user_id", user_id).execute()
    
    update_data = {
        "user_id": user_id,
        "allergens": [a.lower() for a in allergens]
    }
    
    if existing.data:
        result = supabase.table("user_preferences").update(update_data).eq("user_id", user_id).execute()
    else:
        result = supabase.table("user_preferences").insert(update_data).execute()
    
    return {
        "message": "Allergens updated",
        "allergens": allergens
    }
