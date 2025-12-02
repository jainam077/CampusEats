"""Photos endpoints - handles dish photo uploads via Supabase Storage."""

from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.db.supabase import get_supabase
from app.core.config import settings

router = APIRouter()


@router.get("")
async def list_photos(
    dish_id: Optional[int] = None,
    user_id: Optional[int] = None,
    limit: int = 20
):
    """List photos with optional filters."""
    supabase = get_supabase()
    
    query = supabase.table("photo").select("*")
    
    if dish_id:
        query = query.eq("dish_id", dish_id)
    if user_id:
        query = query.eq("user_id", user_id)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    return {"photos": result.data, "total": len(result.data)}


@router.get("/{photo_id}")
async def get_photo(photo_id: int):
    """Get a specific photo by ID."""
    supabase = get_supabase()
    
    result = supabase.table("photo").select("*").eq("id", photo_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return result.data[0]


@router.post("")
async def upload_photo(
    dish_id: int = Form(...),
    user_id: int = Form(...),
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None)
):
    """
    Upload a photo for a dish.
    
    The photo is stored in Supabase Storage and metadata is saved to the photo table.
    """
    # Validate file extension
    allowed_extensions = settings.allowed_extensions_list
    file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.max_photo_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_PHOTO_SIZE_MB}MB"
        )
    
    supabase = get_supabase()
    
    try:
        # Generate unique filename
        import uuid
        filename = f"{dish_id}/{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase Storage
        storage_result = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            filename,
            contents,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(filename)
        
        # Save photo metadata to database
        photo_data = {
            "dish_id": dish_id,
            "user_id": user_id,
            "url": public_url,
            "caption": caption,
            "filename": filename
        }
        
        result = supabase.table("photo").insert(photo_data).execute()
        
        return {
            "message": "Photo uploaded successfully",
            "photo": result.data[0] if result.data else photo_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")


@router.delete("/{photo_id}")
async def delete_photo(photo_id: int, user_id: int):
    """Delete a photo (only by the owner)."""
    supabase = get_supabase()
    
    # Check ownership
    result = supabase.table("photo").select("*").eq("id", photo_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    photo = result.data[0]
    if photo.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    try:
        # Delete from storage
        if photo.get("filename"):
            supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([photo["filename"]])
        
        # Delete from database
        supabase.table("photo").delete().eq("id", photo_id).execute()
        
        return {"message": "Photo deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete photo: {str(e)}")
