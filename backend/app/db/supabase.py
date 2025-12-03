"""Supabase client configuration."""

from functools import lru_cache
from supabase import create_client, Client

from app.core.config import get_settings


@lru_cache()
def get_supabase() -> Client:
    """Get Supabase client instance (cached)."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def get_supabase_admin() -> Client:
    """Get Supabase client with service role (admin) privileges."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
