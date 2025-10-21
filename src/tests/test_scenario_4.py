"""
Unit tests for Test Scenario 4:
User browses menus, finds a dish that appears incorrectly listed, 
uses the "Report Incorrect Menu Item" feature, submits the report, and then quits.
"""
import pytest
from datetime import datetime
from unittest.mock import Mock
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.models import User, Dish, Report
from app.services import ReportService, MenuService

class TestScenario4:
    """Test class for Scenario 4: Report incorrect menu item"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """Mock database connection"""
        return Mock()
    
    @pytest.fixture
    def report_service(self, mock_db_connection):
        """Report service with mocked database connection"""
        return ReportService(mock_db_connection)
    
    @pytest.fixture
    def menu_service(self, mock_db_connection):
        """Menu service with mocked database connection"""
        return MenuService(mock_db_connection)
    
    @pytest.fixture
    def sample_user(self):
        """Sample user for testing"""
        return User(user_id=1, name="Test User", email="test@example.com")
    
    @pytest.fixture
    def sample_incorrect_dish(self):
        """Sample dish that appears incorrectly listed"""
        return Dish(
            dish_id=1, 
            name="Grilled Chicken", 
            description="Fresh grilled chicken breast", 
            category="Main Dishes"
        )
    
    @pytest.fixture
    def sample_report_descriptions(self):
        """Sample report descriptions for different types of issues"""
        return {
            "wrong_category": "This dish is listed under Main Dishes but should be under Sides & Vegetables",
            "incorrect_name": "The dish name is wrong - it should be 'Baked Chicken' not 'Grilled Chicken'",
            "missing_ingredients": "The description is incomplete - it should mention the herbs and spices used",
            "wrong_venue": "This dish doesn't belong to this venue - it's from a different dining hall"
        }
    
    def test_create_report_basic(self, report_service, sample_user, sample_incorrect_dish):
        """Test creating a basic report"""
        # Arrange
        user_id = sample_user.user_id
        dish_id = sample_incorrect_dish.dish_id
        description = "This dish is incorrectly categorized"
        
        # Act
        report = report_service.create_report(user_id, dish_id, description)
        
        # Assert
        assert report is not None
        assert report.user_id == user_id
        assert report.dish_id == dish_id
        assert report.description == description
        assert report.created_at is not None
        assert isinstance(report.created_at, datetime)
    
    def test_create_report_different_issues(self, report_service, sample_user, sample_incorrect_dish, sample_report_descriptions):
        """Test creating reports for different types of issues"""
        # Test wrong category report
        report1 = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            sample_report_descriptions["wrong_category"]
        )
        assert report1.description == sample_report_descriptions["wrong_category"]
        
        # Test incorrect name report
        report2 = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            sample_report_descriptions["incorrect_name"]
        )
        assert report2.description == sample_report_descriptions["incorrect_name"]
        
        # Test missing ingredients report
        report3 = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            sample_report_descriptions["missing_ingredients"]
        )
        assert report3.description == sample_report_descriptions["missing_ingredients"]
    
    def test_submit_report(self, report_service, sample_user, sample_incorrect_dish):
        """Test submitting a report"""
        # Arrange
        report = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            "This dish is incorrectly listed"
        )
        
        # Act
        result = report_service.submit_report(report)
        
        # Assert
        assert result is True
    
    def test_complete_report_workflow(self, report_service, menu_service, sample_user):
        """Test complete report submission workflow"""
        # Step 1: User browses menus and finds incorrect dish
        dishes = menu_service.get_menu_dishes(menu_id=1)
        assert len(dishes) > 0
        
        # Step 2: User identifies incorrect dish
        incorrect_dish = dishes[0]  # Assume first dish is incorrect
        assert incorrect_dish.dish_id is not None
        
        # Step 3: User creates report
        report_description = "This dish appears to be incorrectly listed - wrong category"
        report = report_service.create_report(
            sample_user.user_id,
            incorrect_dish.dish_id,
            report_description
        )
        
        # Step 4: User submits report
        submission_result = report_service.submit_report(report)
        
        # Assertions
        assert submission_result is True
        assert report.user_id == sample_user.user_id
        assert report.dish_id == incorrect_dish.dish_id
        assert report.description == report_description
        assert report.created_at is not None
    
    def test_report_serialization(self, report_service, sample_user, sample_incorrect_dish):
        """Test that report objects can be serialized"""
        # Arrange
        report = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            "Test report description"
        )
        
        # Act
        report_dict = report.to_dict()
        
        # Assert
        assert 'report_id' in report_dict
        assert 'user_id' in report_dict
        assert 'dish_id' in report_dict
        assert 'description' in report_dict
        assert 'created_at' in report_dict
        assert report_dict['user_id'] == sample_user.user_id
        assert report_dict['dish_id'] == sample_incorrect_dish.dish_id
        assert report_dict['description'] == "Test report description"
    
    def test_report_timestamp(self, report_service, sample_user, sample_incorrect_dish):
        """Test that report timestamps are set correctly"""
        # Arrange
        before_creation = datetime.now()
        
        # Act
        report = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            "Test report"
        )
        
        after_creation = datetime.now()
        
        # Assert
        assert report.created_at is not None
        assert before_creation <= report.created_at <= after_creation
    
    def test_report_with_long_description(self, report_service, sample_user, sample_incorrect_dish):
        """Test creating a report with a long description"""
        # Arrange
        long_description = "This is a very detailed report about the incorrect menu item. " * 50  # 2000+ characters
        
        # Act
        report = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            long_description
        )
        
        # Assert
        assert report is not None
        assert report.description == long_description
        assert len(report.description) > 1000
    
    def test_multiple_reports_same_dish(self, report_service, sample_user, sample_incorrect_dish):
        """Test creating multiple reports for the same dish"""
        # Arrange
        descriptions = [
            "Wrong category",
            "Incorrect name",
            "Missing ingredients"
        ]
        
        # Act
        reports = []
        for description in descriptions:
            report = report_service.create_report(
                sample_user.user_id,
                sample_incorrect_dish.dish_id,
                description
            )
            reports.append(report)
        
        # Assert
        assert len(reports) == 3
        assert all(report.user_id == sample_user.user_id for report in reports)
        assert all(report.dish_id == sample_incorrect_dish.dish_id for report in reports)
        assert set(report.description for report in reports) == set(descriptions)
    
    def test_report_different_users(self, report_service, sample_incorrect_dish):
        """Test creating reports from different users for the same dish"""
        # Arrange
        users = [
            User(user_id=1, name="User 1", email="user1@example.com"),
            User(user_id=2, name="User 2", email="user2@example.com"),
            User(user_id=3, name="User 3", email="user3@example.com")
        ]
        
        # Act
        reports = []
        for user in users:
            report = report_service.create_report(
                user.user_id,
                sample_incorrect_dish.dish_id,
                f"Report from {user.name}"
            )
            reports.append(report)
        
        # Assert
        assert len(reports) == 3
        assert all(report.dish_id == sample_incorrect_dish.dish_id for report in reports)
        assert len(set(report.user_id for report in reports)) == 3  # All different users
    
    def test_report_empty_description(self, report_service, sample_user, sample_incorrect_dish):
        """Test creating a report with empty description"""
        # Act
        report = report_service.create_report(
            sample_user.user_id,
            sample_incorrect_dish.dish_id,
            ""
        )
        
        # Assert
        assert report is not None
        assert report.description == ""
        assert report.user_id == sample_user.user_id
        assert report.dish_id == sample_incorrect_dish.dish_id
    
    def test_report_workflow_with_menu_browsing(self, report_service, menu_service, sample_user):
        """Test the complete workflow including menu browsing"""
        # Step 1: Browse menus for today
        from datetime import date
        today = date.today()
        menus = menu_service.get_venue_menus(venue_id=1, target_date=today)
        assert len(menus) > 0
        
        # Step 2: Select a menu (e.g., lunch)
        lunch_menu = next(menu for menu in menus if menu.meal_type == "lunch")
        assert lunch_menu.meal_type == "lunch"
        
        # Step 3: Get dishes for the menu
        dishes = menu_service.get_menu_dishes(lunch_menu.menu_id)
        assert len(dishes) > 0
        
        # Step 4: Find an incorrect dish
        incorrect_dish = dishes[0]  # Assume first dish is incorrect
        
        # Step 5: Create and submit report
        report = report_service.create_report(
            sample_user.user_id,
            incorrect_dish.dish_id,
            "This dish is incorrectly listed in the lunch menu"
        )
        
        result = report_service.submit_report(report)
        
        # Assertions
        assert result is True
        assert report.user_id == sample_user.user_id
        assert report.dish_id == incorrect_dish.dish_id
