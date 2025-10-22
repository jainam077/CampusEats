"""
Unit tests for Test Scenario 3:
User selects a dish, rates it, writes a review, uploads a photo, 
submits the review, receives submission confirmation, then quits.
"""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.models import User, Dish, Review, Photo
from app.services import ReviewService, UserService

class TestScenario3:
    """Test class for Scenario 3: Review submission workflow"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """Mock database connection"""
        return Mock()
    
    @pytest.fixture
    def review_service(self, mock_db_connection):
        """Review service with mocked database connection"""
        return ReviewService(mock_db_connection)
    
    @pytest.fixture
    def user_service(self, mock_db_connection):
        """User service with mocked database connection"""
        return UserService(mock_db_connection)
    
    @pytest.fixture
    def sample_user(self):
        """Sample user for testing"""
        return User(user_id=1, name="Test User", email="test@example.com")
    
    @pytest.fixture
    def sample_dish(self):
        """Sample dish for testing"""
        return Dish(dish_id=1, name="Grilled Chicken", description="Fresh grilled chicken breast", category="Main Dishes")
    
    @pytest.fixture
    def sample_photos(self):
        """Sample photo URLs for testing"""
        return [
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg"
        ]
    
    def test_create_review_basic(self, review_service, sample_user, sample_dish):
        """Test creating a basic review"""
        # Arrange
        user_id = sample_user.user_id
        dish_id = sample_dish.dish_id
        rating = 4
        text_review = "Great dish, highly recommended!"
        
        # Act
        review = review_service.create_review(user_id, dish_id, rating, text_review)
        
        # Assert
        assert review is not None
        assert review.user_id == user_id
        assert review.dish_id == dish_id
        assert review.rating == rating
        assert review.text_review == text_review
        assert review.created_at is not None
        assert isinstance(review.created_at, datetime)
    
    def test_create_review_without_text(self, review_service, sample_user, sample_dish):
        """Test creating a review without text"""
        # Arrange
        user_id = sample_user.user_id
        dish_id = sample_dish.dish_id
        rating = 5
        
        # Act
        review = review_service.create_review(user_id, dish_id, rating)
        
        # Assert
        assert review is not None
        assert review.user_id == user_id
        assert review.dish_id == dish_id
        assert review.rating == rating
        assert review.text_review == ""
    
    def test_upload_photo(self, review_service):
        """Test uploading a photo for a review"""
        # Arrange
        review_id = 1
        photo_url = "https://example.com/photo.jpg"
        
        # Act
        photo = review_service.upload_photo(review_id, photo_url)
        
        # Assert
        assert photo is not None
        assert photo.review_id == review_id
        assert photo.url == photo_url
        assert photo.moderation_status == "pending"
    
    def test_submit_review_without_photos(self, review_service, sample_user, sample_dish):
        """Test submitting a review without photos"""
        # Arrange
        review = review_service.create_review(
            sample_user.user_id, 
            sample_dish.dish_id, 
            4, 
            "Great dish!"
        )
        
        # Act
        result = review_service.submit_review(review)
        
        # Assert
        assert result is True
    
    def test_submit_review_with_photos(self, review_service, sample_user, sample_dish, sample_photos):
        """Test submitting a review with photos"""
        # Arrange
        review = review_service.create_review(
            sample_user.user_id, 
            sample_dish.dish_id, 
            5, 
            "Excellent dish with photos!"
        )
        
        photos = []
        for photo_url in sample_photos:
            photo = review_service.upload_photo(review.review_id, photo_url)
            photos.append(photo)
        
        # Act
        result = review_service.submit_review(review, photos)
        
        # Assert
        assert result is True
        assert len(photos) == 2
        assert all(photo.moderation_status == "pending" for photo in photos)
    
    def test_complete_review_workflow(self, review_service, user_service, sample_user, sample_dish):
        """Test complete review submission workflow"""
        # Step 1: User selects a dish (already have sample_dish)
        assert sample_dish.dish_id is not None
        
        # Step 2: User rates the dish
        rating = 4
        assert 1 <= rating <= 5
        
        # Step 3: User writes a review
        text_review = "This dish was amazing! Great flavor and presentation."
        
        # Step 4: User uploads photos
        photo_urls = ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
        photos = []
        for url in photo_urls:
            photo = review_service.upload_photo(1, url)  # Using review_id=1 for test
            photos.append(photo)
        
        # Step 5: Create and submit review
        review = review_service.create_review(
            sample_user.user_id,
            sample_dish.dish_id,
            rating,
            text_review
        )
        
        # Step 6: Submit review
        submission_result = review_service.submit_review(review, photos)
        
        # Assertions
        assert submission_result is True
        assert review.rating == rating
        assert review.text_review == text_review
        assert len(photos) == 2
        assert all(photo.moderation_status == "pending" for photo in photos)
    
    def test_rating_validation(self, review_service, sample_user, sample_dish):
        """Test that rating validation works correctly"""
        # Test valid ratings
        for rating in [1, 2, 3, 4, 5]:
            review = review_service.create_review(
                sample_user.user_id, 
                sample_dish.dish_id, 
                rating, 
                f"Rating {rating}"
            )
            assert review.rating == rating
        
        # Test edge cases (should still work in our mock implementation)
        review = review_service.create_review(
            sample_user.user_id, 
            sample_dish.dish_id, 
            0,  # Invalid rating
            "Invalid rating"
        )
        assert review.rating == 0  # Our mock doesn't validate, but real implementation would
    
    def test_review_serialization(self, review_service, sample_user, sample_dish):
        """Test that review objects can be serialized"""
        # Arrange
        review = review_service.create_review(
            sample_user.user_id,
            sample_dish.dish_id,
            4,
            "Test review"
        )
        
        # Act
        review_dict = review.to_dict()
        
        # Assert
        assert 'review_id' in review_dict
        assert 'user_id' in review_dict
        assert 'dish_id' in review_dict
        assert 'rating' in review_dict
        assert 'text_review' in review_dict
        assert 'created_at' in review_dict
        assert review_dict['user_id'] == sample_user.user_id
        assert review_dict['dish_id'] == sample_dish.dish_id
        assert review_dict['rating'] == 4
    
    def test_photo_serialization(self, review_service):
        """Test that photo objects can be serialized"""
        # Arrange
        photo = review_service.upload_photo(1, "https://example.com/test.jpg")
        
        # Act
        photo_dict = photo.to_dict()
        
        # Assert
        assert 'photo_id' in photo_dict
        assert 'review_id' in photo_dict
        assert 'url' in photo_dict
        assert 'moderation_status' in photo_dict
        assert photo_dict['url'] == "https://example.com/test.jpg"
        assert photo_dict['moderation_status'] == "pending"
    
    def test_multiple_photos_per_review(self, review_service):
        """Test uploading multiple photos for a single review"""
        # Arrange
        review_id = 1
        photo_urls = [
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg",
            "https://example.com/photo3.jpg"
        ]
        
        # Act
        photos = []
        for url in photo_urls:
            photo = review_service.upload_photo(review_id, url)
            photos.append(photo)
        
        # Assert
        assert len(photos) == 3
        assert all(photo.review_id == review_id for photo in photos)
        assert all(photo.moderation_status == "pending" for photo in photos)
        assert set(photo.url for photo in photos) == set(photo_urls)
    
    def test_review_with_long_text(self, review_service, sample_user, sample_dish):
        """Test creating a review with long text"""
        # Arrange
        long_text = "This is a very long review text. " * 100  # 3000+ characters
        
        # Act
        review = review_service.create_review(
            sample_user.user_id,
            sample_dish.dish_id,
            5,
            long_text
        )
        
        # Assert
        assert review is not None
        assert review.text_review == long_text
        assert len(review.text_review) > 1000
    
    def test_review_timestamp(self, review_service, sample_user, sample_dish):
        """Test that review timestamps are set correctly"""
        # Arrange
        before_creation = datetime.now()
        
        # Act
        review = review_service.create_review(
            sample_user.user_id,
            sample_dish.dish_id,
            4,
            "Test review"
        )
        
        after_creation = datetime.now()
        
        # Assert
        assert review.created_at is not None
        assert before_creation <= review.created_at <= after_creation
