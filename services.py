"""
Business logic services for CampusEats application
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from .models import User, Venue, Menu, Dish, Review, Photo, Report, DietaryTag

class MenuService:
    """Service for menu operations"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def get_venue_menus(self, venue_id: int, target_date: date = None) -> List[Menu]:
        """Get menus for a specific venue and date"""
        if target_date is None:
            target_date = date.today()
        
        # Mock implementation - in real app, this would query the database
        return [
            Menu(menu_id=1, venue_id=venue_id, date=target_date, meal_type="breakfast"),
            Menu(menu_id=2, venue_id=venue_id, date=target_date, meal_type="lunch"),
            Menu(menu_id=3, venue_id=venue_id, date=target_date, meal_type="dinner")
        ]
    
    def get_menu_dishes(self, menu_id: int) -> List[Dish]:
        """Get dishes for a specific menu"""
        # Mock implementation
        return [
            Dish(dish_id=1, name="Grilled Chicken", description="Fresh grilled chicken breast", category="Main Dishes"),
            Dish(dish_id=2, name="Caesar Salad", description="Fresh romaine lettuce with caesar dressing", category="Soups & Salads"),
            Dish(dish_id=3, name="Chocolate Cake", description="Rich chocolate cake", category="Desserts & Sweets")
        ]
    
    def get_dish_details(self, dish_id: int) -> Optional[Dish]:
        """Get detailed information about a specific dish"""
        # Mock implementation
        if dish_id == 1:
            return Dish(dish_id=1, name="Grilled Chicken", 
                       description="Fresh grilled chicken breast with herbs", 
                       category="Main Dishes")
        return None

class FilterService:
    """Service for filtering operations"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def get_dietary_tags(self) -> List[DietaryTag]:
        """Get all available dietary tags"""
        return [
            DietaryTag(tag_id=1, name="vegetarian"),
            DietaryTag(tag_id=2, name="vegan"),
            DietaryTag(tag_id=3, name="gluten-free"),
            DietaryTag(tag_id=4, name="dairy-free"),
            DietaryTag(tag_id=5, name="nut-free")
        ]
    
    def filter_dishes_by_dietary(self, dishes: List[Dish], dietary_tags: List[str]) -> List[Dish]:
        """Filter dishes based on dietary restrictions"""
        if not dietary_tags:
            return dishes
        
        # Mock filtering logic
        filtered_dishes = []
        for dish in dishes:
            dish_lower = dish.name.lower()
            include_dish = True
            
            # Check each dietary restriction
            for tag in dietary_tags:
                if tag == "vegetarian":
                    # Exclude meat dishes for vegetarian
                    if any(meat in dish_lower for meat in ["chicken", "beef", "pork", "fish", "meat", "steak"]):
                        include_dish = False
                        break
                elif tag == "gluten-free":
                    # Exclude bread dishes for gluten-free (unless explicitly gluten-free)
                    if "bread" in dish_lower and "gluten-free" not in dish_lower:
                        include_dish = False
                        break
                elif tag == "vegan":
                    # Exclude meat and dairy for vegan
                    if any(item in dish_lower for item in ["chicken", "beef", "pork", "fish", "meat", "steak", "cheese", "milk", "butter"]):
                        include_dish = False
                        break
                elif tag == "dairy-free":
                    # Exclude dairy products
                    if any(dairy in dish_lower for dairy in ["cheese", "milk", "butter", "cream"]):
                        include_dish = False
                        break
                elif tag == "nut-free":
                    # Exclude nut products
                    if any(nut in dish_lower for nut in ["nut", "almond", "walnut", "peanut"]):
                        include_dish = False
                        break
            
            if include_dish:
                filtered_dishes.append(dish)
        
        return filtered_dishes

class ReviewService:
    """Service for review operations"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def create_review(self, user_id: int, dish_id: int, rating: int, 
                     text_review: str = "", photos: List[str] = None) -> Review:
        """Create a new review"""
        review = Review(
            user_id=user_id,
            dish_id=dish_id,
            rating=rating,
            text_review=text_review,
            created_at=datetime.now()
        )
        
        # In real app, this would save to database
        return review
    
    def upload_photo(self, review_id: int, photo_url: str) -> Photo:
        """Upload a photo for a review"""
        photo = Photo(
            review_id=review_id,
            url=photo_url,
            moderation_status="pending"
        )
        
        # In real app, this would save to database
        return photo
    
    def submit_review(self, review: Review, photos: List[Photo] = None) -> bool:
        """Submit a review for moderation"""
        # Mock implementation - in real app, this would save to database
        return True

class ReportService:
    """Service for report operations"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def create_report(self, user_id: int, dish_id: int, description: str) -> Report:
        """Create a report for an incorrect menu item"""
        report = Report(
            user_id=user_id,
            dish_id=dish_id,
            description=description,
            created_at=datetime.now()
        )
        
        # In real app, this would save to database
        return report
    
    def submit_report(self, report: Report) -> bool:
        """Submit a report for review"""
        # Mock implementation - in real app, this would save to database
        return True

class UserService:
    """Service for user operations"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        # Mock implementation
        if user_id == 1:
            return User(user_id=1, name="Test User", email="test@example.com")
        return None
    
    def create_user(self, name: str, email: str, password_hash: str) -> User:
        """Create a new user"""
        user = User(
            name=name,
            email=email,
            password_hash=password_hash
        )
        
        # In real app, this would save to database
        return user
