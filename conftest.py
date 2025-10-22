"""
Pytest configuration and shared fixtures
"""
import pytest
import sys
import os
from unittest.mock import Mock

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

@pytest.fixture(scope="session")
def test_database_url():
    """Test database URL for integration tests"""
    return "sqlite:///:memory:"

@pytest.fixture
def mock_database_connection():
    """Mock database connection for unit tests"""
    return Mock()

@pytest.fixture
def sample_venue_data():
    """Sample venue data for testing"""
    return {
        'venue_id': 1,
        'name': 'GSU - Piedmont Central',
        'location': 'GSU District',
        'hours': '7:00 AM - 10:00 PM'
    }

@pytest.fixture
def sample_menu_data():
    """Sample menu data for testing"""
    from datetime import date
    return {
        'menu_id': 1,
        'venue_id': 1,
        'date': date.today(),
        'meal_type': 'lunch'
    }

@pytest.fixture
def sample_dish_data():
    """Sample dish data for testing"""
    return {
        'dish_id': 1,
        'name': 'Grilled Chicken',
        'description': 'Fresh grilled chicken breast with herbs',
        'category': 'Main Dishes'
    }

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        'user_id': 1,
        'name': 'Test User',
        'email': 'test@example.com',
        'password_hash': 'hashed_password',
        'preferences': 'vegetarian,gluten-free'
    }

@pytest.fixture
def sample_review_data():
    """Sample review data for testing"""
    from datetime import datetime
    return {
        'review_id': 1,
        'user_id': 1,
        'dish_id': 1,
        'rating': 4,
        'text_review': 'Great dish!',
        'created_at': datetime.now()
    }

@pytest.fixture
def sample_photo_data():
    """Sample photo data for testing"""
    return {
        'photo_id': 1,
        'review_id': 1,
        'url': 'https://example.com/photo.jpg',
        'moderation_status': 'pending'
    }

@pytest.fixture
def sample_report_data():
    """Sample report data for testing"""
    from datetime import datetime
    return {
        'report_id': 1,
        'user_id': 1,
        'dish_id': 1,
        'description': 'This dish is incorrectly listed',
        'created_at': datetime.now()
    }

@pytest.fixture
def sample_dietary_tags_data():
    """Sample dietary tags data for testing"""
    return [
        {'tag_id': 1, 'name': 'vegetarian'},
        {'tag_id': 2, 'name': 'vegan'},
        {'tag_id': 3, 'name': 'gluten-free'},
        {'tag_id': 4, 'name': 'dairy-free'},
        {'tag_id': 5, 'name': 'nut-free'}
    ]

# Pytest markers for test categorization
pytestmark = [
    pytest.mark.unit,
]
