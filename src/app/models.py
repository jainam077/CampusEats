"""
Database models for CampusEats application
"""
from datetime import datetime, date
from typing import List, Optional, Dict, Any
import json

class User:
    """User model"""
    def __init__(self, user_id: int = None, name: str = "", email: str = "", 
                 password_hash: str = "", preferences: str = ""):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.password_hash = password_hash
        self.preferences = preferences
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'password_hash': self.password_hash,
            'preferences': self.preferences
        }

class Venue:
    """Venue model"""
    def __init__(self, venue_id: int = None, name: str = "", location: str = "", hours: str = ""):
        self.venue_id = venue_id
        self.name = name
        self.location = location
        self.hours = hours
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'venue_id': self.venue_id,
            'name': self.name,
            'location': self.location,
            'hours': self.hours
        }

class Menu:
    """Menu model"""
    def __init__(self, menu_id: int = None, venue_id: int = None, 
                 date: date = None, meal_type: str = ""):
        self.menu_id = menu_id
        self.venue_id = venue_id
        self.date = date
        self.meal_type = meal_type
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'menu_id': self.menu_id,
            'venue_id': self.venue_id,
            'date': self.date.isoformat() if self.date else None,
            'meal_type': self.meal_type
        }

class Dish:
    """Dish model"""
    def __init__(self, dish_id: int = None, name: str = "", description: str = "", 
                 category: str = ""):
        self.dish_id = dish_id
        self.name = name
        self.description = description
        self.category = category
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'dish_id': self.dish_id,
            'name': self.name,
            'description': self.description,
            'category': self.category
        }

class Review:
    """Review model"""
    def __init__(self, review_id: int = None, user_id: int = None, dish_id: int = None,
                 rating: int = None, text_review: str = "", created_at: datetime = None):
        self.review_id = review_id
        self.user_id = user_id
        self.dish_id = dish_id
        self.rating = rating
        self.text_review = text_review
        self.created_at = created_at or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'review_id': self.review_id,
            'user_id': self.user_id,
            'dish_id': self.dish_id,
            'rating': self.rating,
            'text_review': self.text_review,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Photo:
    """Photo model"""
    def __init__(self, photo_id: int = None, review_id: int = None, 
                 url: str = "", moderation_status: str = "pending"):
        self.photo_id = photo_id
        self.review_id = review_id
        self.url = url
        self.moderation_status = moderation_status
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'photo_id': self.photo_id,
            'review_id': self.review_id,
            'url': self.url,
            'moderation_status': self.moderation_status
        }

class Report:
    """Report model"""
    def __init__(self, report_id: int = None, user_id: int = None, review_id: int = None,
                 dish_id: int = None, description: str = "", created_at: datetime = None):
        self.report_id = report_id
        self.user_id = user_id
        self.review_id = review_id
        self.dish_id = dish_id
        self.description = description
        self.created_at = created_at or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'report_id': self.report_id,
            'user_id': self.user_id,
            'review_id': self.review_id,
            'dish_id': self.dish_id,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DietaryTag:
    """Dietary tag model"""
    def __init__(self, tag_id: int = None, name: str = ""):
        self.tag_id = tag_id
        self.name = name
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'tag_id': self.tag_id,
            'name': self.name
        }
