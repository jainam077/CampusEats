"""Venues endpoints - connects to Supabase 'venue' table."""

from typing import List
from fastapi import APIRouter, HTTPException, Query

from app.db.supabase import get_supabase

router = APIRouter()


@router.get("")
async def list_venues():
    """List all dining venues."""
    supabase = get_supabase()
    result = supabase.table("venue").select("*").execute()
    
    return {"venues": result.data, "total": len(result.data)}


@router.get("/{venue_id}")
async def get_venue(venue_id: int):
    """Get a specific venue by ID."""
    supabase = get_supabase()
    result = supabase.table("venue").select("*").eq("venue_id", venue_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Venue not found")
    return result.data[0]
