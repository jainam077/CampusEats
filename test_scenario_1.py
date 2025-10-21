"""
Unit tests for Test Scenario 1:
User browses the menu for a specific dining venue for today's date, 
views dish details, and then quits.
"""
import pytest
from datetime import date
from unittest.mock import Mock, patch
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.models import Venue, Menu, Dish
from app.services import MenuService

class TestScenario1:
    """Test class for Scenario 1: Menu browsing and dish details"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """Mock database connection"""
        return Mock()
    
    @pytest.fixture
    def menu_service(self, mock_db_connection):
        """Menu service with mocked database connection"""
        return MenuService(mock_db_connection)
    
    @pytest.fixture
    def sample_venue(self):
        """Sample venue for testing"""
        return Venue(venue_id=1, name="GSU - Piedmont Central", location="GSU District")
    
    @pytest.fixture
    def sample_menus(self):
        """Sample menus for today's date"""
        today = date.today()
        return [
            Menu(menu_id=1, venue_id=1, date=today, meal_type="breakfast"),
            Menu(menu_id=2, venue_id=1, date=today, meal_type="lunch"),
            Menu(menu_id=3, venue_id=1, date=today, meal_type="dinner")
        ]
    
    @pytest.fixture
    def sample_dishes(self):
        """Sample dishes for a menu"""
        return [
            Dish(dish_id=1, name="Grilled Chicken", description="Fresh grilled chicken breast", category="Main Dishes"),
            Dish(dish_id=2, name="Caesar Salad", description="Fresh romaine lettuce with caesar dressing", category="Soups & Salads"),
            Dish(dish_id=3, name="Chocolate Cake", description="Rich chocolate cake", category="Desserts & Sweets")
        ]
    
    def test_get_venue_menus_for_today(self, menu_service, sample_venue):
        """Test getting menus for a venue for today's date"""
        # Act
        menus = menu_service.get_venue_menus(sample_venue.venue_id)
        
        # Assert
        assert len(menus) == 3
        assert all(menu.venue_id == sample_venue.venue_id for menu in menus)
        assert all(menu.date == date.today() for menu in menus)
        assert "breakfast" in [menu.meal_type for menu in menus]
        assert "lunch" in [menu.meal_type for menu in menus]
        assert "dinner" in [menu.meal_type for menu in menus]
    
    def test_get_venue_menus_for_specific_date(self, menu_service, sample_venue):
        """Test getting menus for a venue for a specific date"""
        # Arrange
        specific_date = date(2025, 10, 20)
        
        # Act
        menus = menu_service.get_venue_menus(sample_venue.venue_id, specific_date)
        
        # Assert
        assert len(menus) == 3
        assert all(menu.date == specific_date for menu in menus)
    
    def test_get_menu_dishes(self, menu_service):
        """Test getting dishes for a specific menu"""
        # Act
        dishes = menu_service.get_menu_dishes(menu_id=1)
        
        # Assert
        assert len(dishes) == 3
        assert all(isinstance(dish, Dish) for dish in dishes)
        assert any(dish.category == "Main Dishes" for dish in dishes)
        assert any(dish.category == "Soups & Salads" for dish in dishes)
        assert any(dish.category == "Desserts & Sweets" for dish in dishes)
    
    def test_get_dish_details_existing_dish(self, menu_service):
        """Test getting details for an existing dish"""
        # Act
        dish = menu_service.get_dish_details(dish_id=1)
        
        # Assert
        assert dish is not None
        assert dish.dish_id == 1
        assert dish.name == "Grilled Chicken"
        assert "chicken" in dish.description.lower()
        assert dish.category == "Main Dishes"
    
    def test_get_dish_details_nonexistent_dish(self, menu_service):
        """Test getting details for a non-existent dish"""
        # Act
        dish = menu_service.get_dish_details(dish_id=999)
        
        # Assert
        assert dish is None
    
    def test_menu_browsing_workflow(self, menu_service, sample_venue):
        """Test complete menu browsing workflow"""
        # Step 1: Get menus for venue
        menus = menu_service.get_venue_menus(sample_venue.venue_id)
        assert len(menus) > 0
        
        # Step 2: Select a menu (e.g., lunch)
        lunch_menu = next(menu for menu in menus if menu.meal_type == "lunch")
        assert lunch_menu.meal_type == "lunch"
        
        # Step 3: Get dishes for the selected menu
        dishes = menu_service.get_menu_dishes(lunch_menu.menu_id)
        assert len(dishes) > 0
        
        # Step 4: View details of a specific dish
        if dishes:
            dish_details = menu_service.get_dish_details(dishes[0].dish_id)
            assert dish_details is not None
            assert dish_details.name is not None
    
    def test_menu_data_structure(self, sample_menus, sample_dishes):
        """Test that menu and dish data structures are correct"""
        # Test menu structure
        for menu in sample_menus:
            assert hasattr(menu, 'menu_id')
            assert hasattr(menu, 'venue_id')
            assert hasattr(menu, 'date')
            assert hasattr(menu, 'meal_type')
            assert isinstance(menu.date, date)
        
        # Test dish structure
        for dish in sample_dishes:
            assert hasattr(dish, 'dish_id')
            assert hasattr(dish, 'name')
            assert hasattr(dish, 'description')
            assert hasattr(dish, 'category')
            assert dish.name is not None
            assert dish.category is not None
    
    def test_menu_serialization(self, sample_menus, sample_dishes):
        """Test that menu and dish objects can be serialized"""
        # Test menu serialization
        for menu in sample_menus:
            menu_dict = menu.to_dict()
            assert 'menu_id' in menu_dict
            assert 'venue_id' in menu_dict
            assert 'date' in menu_dict
            assert 'meal_type' in menu_dict
        
        # Test dish serialization
        for dish in sample_dishes:
            dish_dict = dish.to_dict()
            assert 'dish_id' in dish_dict
            assert 'name' in dish_dict
            assert 'description' in dish_dict
            assert 'category' in dish_dict
