"""Menus endpoints - connects to Supabase 'menu' and 'menu_dish' tables."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.db.supabase import get_supabase

router = APIRouter()


@router.get("")
async def list_menus(
    venue_id: Optional[int] = Query(None, description="Filter by venue"),
    menu_date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    meal_type: Optional[str] = Query(None, description="Filter by meal type"),
):
    """List menus with optional filters."""
    supabase = get_supabase()
    query = supabase.table("menu").select("*")
    
    if venue_id:
        query = query.eq("venue_id", venue_id)
    if menu_date:
        query = query.eq("menu_date", menu_date)
    if meal_type:
        query = query.eq("meal_type", meal_type.lower())
    
    result = query.order("menu_date", desc=True).execute()
    return {"menus": result.data, "total": len(result.data)}


@router.get("/{menu_id}")
async def get_menu(menu_id: int):
    """Get a specific menu with its dishes."""
    supabase = get_supabase()
    
    # Get menu
    menu_result = supabase.table("menu").select("*").eq("menu_id", menu_id).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    menu = menu_result.data[0]
    
    # Get dishes for this menu via menu_dish junction
    dishes_result = supabase.table("menu_dish").select(
        "*, dish(*)"
    ).eq("menu_id", menu_id).execute()
    
    # Extract dishes with nutrition from junction
    dishes = []
    for md in dishes_result.data:
        if md.get("dish"):
            dish = md["dish"]
            dish["serving_nutrition"] = md.get("nutrition")  # Nutrition from menu_dish
            dish["station"] = md.get("station")
            dishes.append(dish)
    
    menu["dishes"] = dishes
    return menu


@router.get("/venue/{venue_id}/date/{menu_date}")
async def get_venue_menus_by_date(venue_id: int, menu_date: str):
    """Get all menus for a venue on a specific date."""
    supabase = get_supabase()
    
    result = supabase.table("menu").select("*").eq(
        "venue_id", venue_id
    ).eq("menu_date", menu_date).execute()
    
    menus = []
    for menu in result.data:
        # Get dishes for each menu
        dishes_result = supabase.table("menu_dish").select(
            "*, dish(*)"
        ).eq("menu_id", menu["menu_id"]).execute()
        
        dishes = []
        for md in dishes_result.data:
            if md.get("dish"):
                dish = md["dish"]
                dish["serving_nutrition"] = md.get("nutrition")
                dishes.append(dish)
        
        menu["dishes"] = dishes
        menus.append(menu)
    
    return {"menus": menus, "venue_id": venue_id, "date": menu_date}
