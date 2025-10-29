# models.py
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from .database import Base


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class User(TimestampMixin, Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    preferences = Column(String(255))

    def __repr__(self) -> str:
        return f"User(user_id={self.user_id!r}, email={self.email!r})"
