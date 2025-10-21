"""
Unit tests for Test Scenario 2:
User browses the menu, applies dietary filters (e.g., vegetarian, gluten-free), 
checks the filtered results, then quits.
"""
import pytest
from unittest.mock import Mock
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.models import Dish, DietaryTag
from app.services import FilterService

class TestScenario2:
    """Test class for Scenario 2: Dietary filtering"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """Mock database connection"""
        return Mock()
    
    @pytest.fixture
    def filter_service(self, mock_db_connection):
        """Filter service with mocked database connection"""
        return FilterService(mock_db_connection)
    
    @pytest.fixture
    def sample_dishes(self):
        """Sample dishes for filtering tests"""
        return [
            Dish(dish_id=1, name="Grilled Chicken", description="Fresh grilled chicken breast", category="Main Dishes"),
            Dish(dish_id=2, name="Caesar Salad", description="Fresh romaine lettuce with caesar dressing", category="Soups & Salads"),
            Dish(dish_id=3, name="Vegetarian Pasta", description="Pasta with vegetables", category="Main Dishes"),
            Dish(dish_id=4, name="Gluten-Free Bread", description="Bread made without gluten", category="Breads & Pastries"),
            Dish(dish_id=5, name="Chocolate Cake", description="Rich chocolate cake", category="Desserts & Sweets"),
            Dish(dish_id=6, name="Vegan Burger", description="Plant-based burger", category="Main Dishes"),
            Dish(dish_id=7, name="Regular Bread", description="Regular wheat bread", category="Breads & Pastries"),
            Dish(dish_id=8, name="Beef Steak", description="Grilled beef steak", category="Main Dishes")
        ]
    
    @pytest.fixture
    def sample_dietary_tags(self):
        """Sample dietary tags"""
        return [
            DietaryTag(tag_id=1, name="vegetarian"),
            DietaryTag(tag_id=2, name="vegan"),
            DietaryTag(tag_id=3, name="gluten-free"),
            DietaryTag(tag_id=4, name="dairy-free"),
            DietaryTag(tag_id=5, name="nut-free")
        ]
    
    def test_get_dietary_tags(self, filter_service):
        """Test getting all available dietary tags"""
        # Act
        tags = filter_service.get_dietary_tags()
        
        # Assert
        assert len(tags) == 5
        assert all(isinstance(tag, DietaryTag) for tag in tags)
        assert any(tag.name == "vegetarian" for tag in tags)
        assert any(tag.name == "vegan" for tag in tags)
        assert any(tag.name == "gluten-free" for tag in tags)
        assert any(tag.name == "dairy-free" for tag in tags)
        assert any(tag.name == "nut-free" for tag in tags)
    
    def test_filter_dishes_no_filters(self, filter_service, sample_dishes):
        """Test filtering dishes with no dietary restrictions"""
        # Act
        filtered_dishes = filter_service.filter_dishes_by_dietary(sample_dishes, [])
        
        # Assert
        assert len(filtered_dishes) == len(sample_dishes)
        assert all(dish in sample_dishes for dish in filtered_dishes)
    
    def test_filter_dishes_vegetarian(self, filter_service, sample_dishes):
        """Test filtering dishes for vegetarian options"""
        # Act
        filtered_dishes = filter_service.filter_dishes_by_dietary(sample_dishes, ["vegetarian"])
        
        # Assert
        assert len(filtered_dishes) > 0
        # Should exclude chicken dishes
        assert not any("chicken" in dish.name.lower() for dish in filtered_dishes)
        # Should include vegetarian dishes
        assert any("vegetarian" in dish.name.lower() for dish in filtered_dishes)
    
    def test_filter_dishes_gluten_free(self, filter_service, sample_dishes):
        """Test filtering dishes for gluten-free options"""
        # Act
        filtered_dishes = filter_service.filter_dishes_by_dietary(sample_dishes, ["gluten-free"])
        
        # Assert
        assert len(filtered_dishes) > 0
        # Should exclude regular bread dishes (but allow gluten-free bread)
        assert not any("bread" in dish.name.lower() and "gluten-free" not in dish.name.lower() for dish in filtered_dishes)
        # Should include gluten-free dishes
        assert any("gluten-free" in dish.name.lower() for dish in filtered_dishes)
    
    def test_filter_dishes_multiple_restrictions(self, filter_service, sample_dishes):
        """Test filtering dishes with multiple dietary restrictions"""
        # Act
        filtered_dishes = filter_service.filter_dishes_by_dietary(sample_dishes, ["vegetarian", "gluten-free"])
        
        # Assert
        assert len(filtered_dishes) > 0
        # Should exclude both chicken and regular bread dishes
        assert not any("chicken" in dish.name.lower() for dish in filtered_dishes)
        assert not any("bread" in dish.name.lower() and "gluten-free" not in dish.name.lower() for dish in filtered_dishes)
    
    def test_filter_workflow(self, filter_service, sample_dishes):
        """Test complete dietary filtering workflow"""
        # Step 1: Get all dishes
        all_dishes = sample_dishes
        assert len(all_dishes) > 0
        
        # Step 2: Get available dietary tags
        dietary_tags = filter_service.get_dietary_tags()
        assert len(dietary_tags) > 0
        
        # Step 3: Apply vegetarian filter
        vegetarian_dishes = filter_service.filter_dishes_by_dietary(all_dishes, ["vegetarian"])
        assert len(vegetarian_dishes) < len(all_dishes)
        
        # Step 4: Apply gluten-free filter
        gluten_free_dishes = filter_service.filter_dishes_by_dietary(all_dishes, ["gluten-free"])
        assert len(gluten_free_dishes) < len(all_dishes)
        
        # Step 5: Apply both filters
        combined_filtered = filter_service.filter_dishes_by_dietary(all_dishes, ["vegetarian", "gluten-free"])
        assert len(combined_filtered) <= len(vegetarian_dishes)
        assert len(combined_filtered) <= len(gluten_free_dishes)
    
    def test_dietary_tag_structure(self, sample_dietary_tags):
        """Test that dietary tag data structure is correct"""
        for tag in sample_dietary_tags:
            assert hasattr(tag, 'tag_id')
            assert hasattr(tag, 'name')
            assert tag.name is not None
            assert isinstance(tag.name, str)
    
    def test_dietary_tag_serialization(self, sample_dietary_tags):
        """Test that dietary tag objects can be serialized"""
        for tag in sample_dietary_tags:
            tag_dict = tag.to_dict()
            assert 'tag_id' in tag_dict
            assert 'name' in tag_dict
            assert tag_dict['name'] == tag.name
    
    def test_filter_performance(self, filter_service, sample_dishes):
        """Test that filtering performs reasonably with larger datasets"""
        # Create a larger dataset
        large_dish_list = sample_dishes * 10  # 60 dishes
        
        # Act
        filtered_dishes = filter_service.filter_dishes_by_dietary(large_dish_list, ["vegetarian"])
        
        # Assert
        assert len(filtered_dishes) > 0
        assert len(filtered_dishes) < len(large_dish_list)
    
    def test_invalid_dietary_tags(self, filter_service, sample_dishes):
        """Test filtering with invalid dietary tags"""
        # Act
        filtered_dishes = filter_service.filter_dishes_by_dietary(sample_dishes, ["invalid-tag"])
        
        # Assert - should return all dishes when no valid filters apply
        assert len(filtered_dishes) == len(sample_dishes)
    
    def test_empty_dish_list(self, filter_service):
        """Test filtering with empty dish list"""
        # Act
        filtered_dishes = filter_service.filter_dishes_by_dietary([], ["vegetarian"])
        
        # Assert
        assert len(filtered_dishes) == 0
