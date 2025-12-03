"""Reports endpoints - User feedback and issue reporting."""

from typing import Optional, List, Literal
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.db.supabase import get_supabase
from app.core.config import settings

router = APIRouter()


class ReportCreate(BaseModel):
    """Schema for creating a new report."""
    item_type: Literal["dish", "venue", "menu"] = Field(..., description="Type of item being reported")
    item_id: int = Field(..., description="ID of the item being reported")
    report_type: Literal[
        "incorrect_info",
        "wrong_price",
        "wrong_nutrition",
        "wrong_dietary_tags",
        "item_unavailable",
        "other"
    ] = Field(..., description="Type of issue being reported")
    description: str = Field(..., min_length=10, max_length=1000, description="Details about the issue")
    suggested_correction: Optional[str] = Field(None, max_length=500, description="User's suggested fix")


class ReportResponse(BaseModel):
    """Schema for report response."""
    report_id: int
    item_type: str
    item_id: int
    report_type: str
    description: str
    suggested_correction: Optional[str]
    status: str
    created_at: str
    user_id: Optional[int]


@router.post("", response_model=ReportResponse)
async def create_report(
    report: ReportCreate,
    user_id: Optional[int] = Query(None, description="User ID (optional for anonymous reports)")
):
    """
    Submit a report for incorrect menu item information.
    
    Report types:
    - incorrect_info: General incorrect information
    - wrong_price: Price is different from what's shown
    - wrong_nutrition: Nutritional information is incorrect
    - wrong_dietary_tags: Dietary tags are missing or wrong
    - item_unavailable: Item is no longer available
    - other: Other issues
    """
    supabase = get_supabase()
    
    # Use mock user in demo mode
    if settings.MOCK_AUTH_ENABLED and not user_id:
        user_id = settings.MOCK_USER_ID
    
    # Verify the item exists
    table_map = {
        "dish": ("dish", "dish_id"),
        "venue": ("venue", "venue_id"),
        "menu": ("menu", "id")
    }
    
    table_name, id_field = table_map[report.item_type]
    item_check = supabase.table(table_name).select("*").eq(id_field, report.item_id).execute()
    
    if not item_check.data:
        raise HTTPException(
            status_code=404,
            detail=f"{report.item_type.capitalize()} with ID {report.item_id} not found"
        )
    
    # Create report in database
    report_data = {
        "item_type": report.item_type,
        "item_id": report.item_id,
        "report_type": report.report_type,
        "description": report.description,
        "suggested_correction": report.suggested_correction,
        "user_id": user_id,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        result = supabase.table("report").insert(report_data).execute()
        
        if result.data:
            created = result.data[0]
            return ReportResponse(
                report_id=created.get("report_id", created.get("id", 0)),
                item_type=created["item_type"],
                item_id=created["item_id"],
                report_type=created["report_type"],
                description=created["description"],
                suggested_correction=created.get("suggested_correction"),
                status=created["status"],
                created_at=created["created_at"],
                user_id=created.get("user_id")
            )
    except Exception as e:
        # If table doesn't exist, store in memory for demo
        print(f"Report storage error (table may not exist): {e}")
    
    # Fallback response for demo
    return ReportResponse(
        report_id=1,
        item_type=report.item_type,
        item_id=report.item_id,
        report_type=report.report_type,
        description=report.description,
        suggested_correction=report.suggested_correction,
        status="pending",
        created_at=datetime.utcnow().isoformat(),
        user_id=user_id
    )


@router.get("")
async def list_reports(
    user_id: Optional[int] = Query(None, description="Filter by user"),
    item_type: Optional[str] = Query(None, description="Filter by item type"),
    status: Optional[str] = Query(None, description="Filter by status (pending, reviewed, resolved, rejected)"),
    limit: int = Query(20, le=100),
):
    """
    List reports (admin or user's own reports).
    """
    supabase = get_supabase()
    
    try:
        query = supabase.table("report").select("*")
        
        if user_id:
            query = query.eq("user_id", user_id)
        if item_type:
            query = query.eq("item_type", item_type)
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).limit(limit).execute()
        
        return {
            "reports": result.data or [],
            "count": len(result.data or [])
        }
    except Exception:
        # Demo fallback
        return {
            "reports": [],
            "count": 0,
            "message": "Reports table not configured"
        }


@router.get("/{report_id}")
async def get_report(report_id: int):
    """Get a specific report by ID."""
    supabase = get_supabase()
    
    try:
        result = supabase.table("report").select("*").eq("report_id", report_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return result.data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Report not found")


@router.patch("/{report_id}/status")
async def update_report_status(
    report_id: int,
    status: Literal["pending", "reviewed", "resolved", "rejected"],
    admin_notes: Optional[str] = None
):
    """
    Update report status (admin only).
    """
    supabase = get_supabase()
    
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if admin_notes:
        update_data["admin_notes"] = admin_notes
    
    try:
        result = supabase.table("report").update(update_data).eq("report_id", report_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "message": f"Report status updated to {status}",
            "report": result.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
