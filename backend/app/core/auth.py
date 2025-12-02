"""
Authentication utilities - JWT token handling and password hashing.
Uses Supabase for user storage.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash (simple SHA256 for demo)."""
    hashed_input = hashlib.sha256(plain_password.encode()).hexdigest()
    return hashed_input == hashed_password


def get_password_hash(password: str) -> str:
    """Hash a password with SHA256 (use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


async def get_current_user_id(
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[int]:
    """
    Get current user ID from JWT token.
    Returns None if no valid token (for optional auth).
    """
    # Mock auth for demos
    if settings.MOCK_AUTH_ENABLED:
        return settings.MOCK_USER_ID
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        return None


async def get_current_user_required(
    user_id: Optional[int] = Depends(get_current_user_id),
) -> int:
    """
    Get current user ID, raising 401 if not authenticated.
    """
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
