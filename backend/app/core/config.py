"""
Application configuration settings.
Uses Supabase as the primary database.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the backend directory
BACKEND_DIR = Path(__file__).parent.parent.parent
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Supabase (Primary Database)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""  # Also called SUPABASE_KEY
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Auth
    SECRET_KEY: str = "development-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    MOCK_AUTH_ENABLED: bool = True  # Enable for demos
    MOCK_USER_ID: int = 1
    MOCK_USER_EMAIL: str = "demo@campuseats.edu"

    # Photo Storage (uses Supabase Storage)
    SUPABASE_STORAGE_BUCKET: str = "photos"
    MAX_PHOTO_SIZE_MB: int = 2
    ALLOWED_PHOTO_EXTENSIONS: str = "jpg,jpeg,png,webp"

    # LLM (Optional)
    LLM_ENABLED: bool = False
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"

    # Data Ingestion
    NUTRISLICE_DISTRICT: str = "gsu"
    NUTRISLICE_ENABLED: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [e.strip().lower() for e in self.ALLOWED_PHOTO_EXTENSIONS.split(",")]

    @property
    def max_photo_size_bytes(self) -> int:
        return self.MAX_PHOTO_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
