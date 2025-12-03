"""Authentication endpoints - connects to Supabase 'user' table."""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user_required,
)
from app.db.supabase import get_supabase

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    email: str = Form(...),
    password: str = Form(...),
    name: Optional[str] = Form(None),
):
    """Register a new user."""
    supabase = get_supabase()
    
    # Check if email exists
    existing = supabase.table("user").select("user_id").eq(
        "email", email.lower()
    ).execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    result = supabase.table("user").insert({
        "email": email.lower(),
        "name": name,
        "password_hash": get_password_hash(password),
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    user = result.data[0]
    return {"user_id": user["user_id"], "email": user["email"], "name": user.get("name")}


@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Get access token (OAuth2 password flow)."""
    supabase = get_supabase()
    
    # Find user by email
    result = supabase.table("user").select("*").eq(
        "email", form_data.username.lower()
    ).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = result.data[0]
    
    if not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    access_token = create_access_token(
        subject=str(user["user_id"]),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_current_user(user_id: int = Depends(get_current_user_required)):
    """Get current authenticated user (uses mock in demo mode)."""
    supabase = get_supabase()
    
    result = supabase.table("user").select("*").eq("user_id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = result.data[0]
    # Don't return password hash
    user.pop("password_hash", None)
    return user
