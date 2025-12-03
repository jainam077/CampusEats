"""
Nutrislice menu scraper for Georgia State University dining halls.
"""

import httpx
from datetime import date, timedelta
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

# GSU Dining Halls configuration
GSU_SCHOOLS = {
    "gsu-main": {
        "name": "Georgia State University - Main Campus",
        "district": "gsu",
        "menus": ["commons", "langdale", "piedmont-north"]
    },
    "gsu-perimeter": {
        "name": "Georgia State University - Perimeter", 
        "district": "gsu",
        "menus": ["perimeter-cafe"]
    }
}

NUTRISLICE_BASE_URL = "https://{district}.nutrislice.com/menu/api/weeks/school/{school}/menu-type/{menu_type}/{date}"


class NutrisliceScraper:
    """Scraper for Nutrislice menu data."""
    
    def __init__(self, district: str = "gsu"):
        self.district = district
        self.client = httpx.Client(timeout=30.0)
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.client.close()
    
    def get_menu_url(self, school: str, menu_type: str, menu_date: date) -> str:
        """Build Nutrislice API URL."""
        return NUTRISLICE_BASE_URL.format(
            district=self.district,
            school=school,
            menu_type=menu_type,
            date=menu_date.isoformat()
        )
    
    def fetch_menu(self, school: str, menu_type: str, menu_date: date) -> Optional[Dict]:
        """Fetch menu data from Nutrislice API."""
        url = self.get_menu_url(school, menu_type, menu_date)
        
        try:
            response = self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch menu from {url}: {e}")
            return None
    
    def parse_dishes(self, menu_data: Dict) -> List[Dict[str, Any]]:
        """Parse dish information from menu data."""
        dishes = []
        
        if not menu_data:
            return dishes
        
        days = menu_data.get("days", [])
        for day in days:
            menu_items = day.get("menu_items", [])
            for item in menu_items:
                food = item.get("food", {})
                if not food:
                    continue
                
                dish = {
                    "name": food.get("name", ""),
                    "description": food.get("description", ""),
                    "calories": food.get("rounded_nutrition_info", {}).get("calories"),
                    "protein": food.get("rounded_nutrition_info", {}).get("g_protein"),
                    "carbs": food.get("rounded_nutrition_info", {}).get("g_carbs"),
                    "fat": food.get("rounded_nutrition_info", {}).get("g_fat"),
                    "dietary_tags": self._extract_dietary_tags(food),
                    "allergens": food.get("allergens", []),
                    "ingredients": food.get("ingredients", ""),
                    "serving_size": food.get("serving_size_info", ""),
                    "image_url": food.get("image_url"),
                }
                dishes.append(dish)
        
        return dishes
    
    def _extract_dietary_tags(self, food: Dict) -> List[str]:
        """Extract dietary tags from food item."""
        tags = []
        icons = food.get("icons", [])
        
        tag_mapping = {
            "vegetarian": "vegetarian",
            "vegan": "vegan", 
            "gluten-free": "gluten-free",
            "contains-nuts": "contains-nuts",
            "halal": "halal",
            "kosher": "kosher",
        }
        
        for icon in icons:
            icon_name = icon.get("name", "").lower()
            for key, tag in tag_mapping.items():
                if key in icon_name:
                    tags.append(tag)
        
        return tags
    
    def scrape_week(self, school: str, menu_type: str, start_date: date = None) -> List[Dict]:
        """Scrape a week's worth of menu data."""
        if start_date is None:
            start_date = date.today()
        
        menu_data = self.fetch_menu(school, menu_type, start_date)
        return self.parse_dishes(menu_data)


def run_scraper(
    venue_id: Optional[int] = None,
    days_ahead: int = 7,
    supabase_client = None
) -> Dict[str, Any]:
    """
    Run the menu scraper.
    
    Args:
        venue_id: Optional venue ID to scrape (None = all venues)
        days_ahead: Number of days ahead to scrape
        supabase_client: Supabase client instance
    
    Returns:
        Dictionary with scraping results
    """
    results = {
        "venues_processed": 0,
        "dishes_added": 0,
        "menus_created": 0,
        "errors": []
    }
    
    try:
        with NutrisliceScraper() as scraper:
            for school_id, school_data in GSU_SCHOOLS.items():
                for menu_type in school_data["menus"]:
                    try:
                        dishes = scraper.scrape_week(
                            school=menu_type,
                            menu_type="lunch",  # Default to lunch
                            start_date=date.today()
                        )
                        results["dishes_added"] += len(dishes)
                        results["venues_processed"] += 1
                        
                        # If supabase client provided, save to database
                        if supabase_client and dishes:
                            for dish in dishes:
                                try:
                                    # Upsert dish
                                    supabase_client.table("dish").upsert(
                                        dish,
                                        on_conflict="name"
                                    ).execute()
                                except Exception as e:
                                    logger.warning(f"Failed to save dish: {e}")
                    
                    except Exception as e:
                        results["errors"].append(f"Error scraping {menu_type}: {str(e)}")
                        logger.error(f"Scraping error: {e}")
    
    except Exception as e:
        results["errors"].append(f"Scraper initialization error: {str(e)}")
    
    return results


def analyze_dish_allergens(dish_name: str, ingredients: str = "") -> Dict[str, Any]:
    """
    Analyze a dish for potential allergens.
    
    Args:
        dish_name: Name of the dish
        ingredients: Ingredient list (optional)
    
    Returns:
        Dictionary with allergen analysis
    """
    text = f"{dish_name} {ingredients}".lower()
    
    allergen_keywords = {
        "milk": ["milk", "cream", "cheese", "butter", "yogurt", "lactose", "whey", "casein"],
        "eggs": ["egg", "eggs", "mayonnaise", "mayo"],
        "fish": ["fish", "salmon", "tuna", "cod", "tilapia", "anchovy"],
        "shellfish": ["shrimp", "crab", "lobster", "clam", "mussel", "oyster", "scallop"],
        "tree_nuts": ["almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "macadamia"],
        "peanuts": ["peanut", "peanuts"],
        "wheat": ["wheat", "flour", "bread", "pasta", "noodle", "breaded"],
        "soy": ["soy", "soya", "tofu", "edamame", "tempeh"],
        "sesame": ["sesame", "tahini"],
    }
    
    detected = {}
    for allergen, keywords in allergen_keywords.items():
        for keyword in keywords:
            if keyword in text:
                detected[allergen] = True
                break
        if allergen not in detected:
            detected[allergen] = False
    
    return {
        "dish_name": dish_name,
        "allergens_detected": [k for k, v in detected.items() if v],
        "allergen_details": detected,
    }
