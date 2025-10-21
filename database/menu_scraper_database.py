import requests
import sqlite3
import hashlib
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
import json

class MenuScraperDatabase:
    """
    Enhanced menu scraper that integrates with database according to ERD schema
    """
    
    def __init__(self, db_path: str = "menu_database.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
    def connect_database(self):
        """Connect to SQLite database and create tables if they don't exist"""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self.create_tables()
        
    def create_tables(self):
        """Create database tables according to ERD schema"""
        
        # User table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS User (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                preferences TEXT
            )
        ''')
        
        # Venue table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS Venue (
                venue_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                hours TEXT
            )
        ''')
        
        # Menu table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS Menu (
                menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
                venue_id INTEGER NOT NULL,
                date DATE NOT NULL,
                meal_type TEXT NOT NULL,
                FOREIGN KEY (venue_id) REFERENCES Venue(venue_id),
                UNIQUE(venue_id, date, meal_type)
            )
        ''')
        
        # Dish table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS Dish (
                dish_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL
            )
        ''')
        
        # MenuDish junction table (many-to-many relationship)
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS MenuDish (
                menu_id INTEGER,
                dish_id INTEGER,
                PRIMARY KEY (menu_id, dish_id),
                FOREIGN KEY (menu_id) REFERENCES Menu(menu_id),
                FOREIGN KEY (dish_id) REFERENCES Dish(dish_id)
            )
        ''')
        
        # Review table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS Review (
                review_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                dish_id INTEGER NOT NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                text_review TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES User(user_id),
                FOREIGN KEY (dish_id) REFERENCES Dish(dish_id)
            )
        ''')
        
        # Photo table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS Photo (
                photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                moderation_status TEXT DEFAULT 'pending',
                FOREIGN KEY (review_id) REFERENCES Review(review_id)
            )
        ''')
        
        # DietaryTag table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS DietaryTag (
                tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )
        ''')
        
        # ReviewDietaryTag junction table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS ReviewDietaryTag (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id INTEGER NOT NULL,
                dish_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                FOREIGN KEY (review_id) REFERENCES Review(review_id),
                FOREIGN KEY (dish_id) REFERENCES Dish(dish_id),
                FOREIGN KEY (tag_id) REFERENCES DietaryTag(tag_id),
                UNIQUE(review_id, dish_id, tag_id)
            )
        ''')
        
        # Report table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS Report (
                report_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                review_id INTEGER,
                description TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES User(user_id),
                FOREIGN KEY (review_id) REFERENCES Review(review_id)
            )
        ''')
        
        # AdminAction table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS AdminAction (
                action_id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                admin_user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (report_id) REFERENCES Report(report_id),
                FOREIGN KEY (admin_user_id) REFERENCES User(user_id)
            )
        ''')
        
        self.conn.commit()
        print("Database tables created successfully!")
    
    def get_or_create_venue(self, district: str, school: str) -> int:
        """Get or create venue and return venue_id"""
        venue_name = f"{district.upper()} - {school.replace('-', ' ').title()}"
        location = f"{district} District"
        
        # Check if venue exists
        self.cursor.execute(
            "SELECT venue_id FROM Venue WHERE name = ? AND location = ?",
            (venue_name, location)
        )
        result = self.cursor.fetchone()
        
        if result:
            return result[0]
        
        # Create new venue
        self.cursor.execute(
            "INSERT INTO Venue (name, location, hours) VALUES (?, ?, ?)",
            (venue_name, location, "Hours not specified")
        )
        self.conn.commit()
        return self.cursor.lastrowid
    
    def get_or_create_menu(self, venue_id: int, date_str: str, meal_type: str) -> int:
        """Get or create menu and return menu_id"""
        # Parse date
        try:
            menu_date = datetime.strptime(date_str, "%Y/%m/%d").date()
        except ValueError:
            print(f"Invalid date format: {date_str}")
            return None
        
        # Check if menu exists
        self.cursor.execute(
            "SELECT menu_id FROM Menu WHERE venue_id = ? AND date = ? AND meal_type = ?",
            (venue_id, menu_date, meal_type)
        )
        result = self.cursor.fetchone()
        
        if result:
            return result[0]
        
        # Create new menu
        self.cursor.execute(
            "INSERT INTO Menu (venue_id, date, meal_type) VALUES (?, ?, ?)",
            (venue_id, menu_date, meal_type)
        )
        self.conn.commit()
        return self.cursor.lastrowid
    
    def get_or_create_dish(self, name: str, category: str, description: str = None) -> int:
        """Get or create dish and return dish_id"""
        # Check if dish exists
        self.cursor.execute(
            "SELECT dish_id FROM Dish WHERE name = ?",
            (name,)
        )
        result = self.cursor.fetchone()
        
        if result:
            return result[0]
        
        # Create new dish
        self.cursor.execute(
            "INSERT INTO Dish (name, description, category) VALUES (?, ?, ?)",
            (name, description, category)
        )
        self.conn.commit()
        return self.cursor.lastrowid
    
    def link_menu_dish(self, menu_id: int, dish_id: int):
        """Link a dish to a menu"""
        try:
            self.cursor.execute(
                "INSERT INTO MenuDish (menu_id, dish_id) VALUES (?, ?)",
                (menu_id, dish_id)
            )
            self.conn.commit()
        except sqlite3.IntegrityError:
            # Link already exists, ignore
            pass
    
    def fetch_and_store_menu(self, district: str, school: str, menu_type: str, date_str: str):
        """Fetch menu data and store in database according to ERD schema"""
        
        # Get or create venue
        venue_id = self.get_or_create_venue(district, school)
        print(f"Venue ID: {venue_id}")
        
        # Get or create menu
        menu_id = self.get_or_create_menu(venue_id, date_str, menu_type)
        if not menu_id:
            return
        print(f"Menu ID: {menu_id}")
        
        # Fetch menu data from API
        url = f"https://{district}.api.nutrislice.com/menu/api/weeks/school/{school}/menu-type/{menu_type}/{date_str}?format=json"
        
        try:
            response = requests.get(url, timeout=20)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Failed to fetch menu: {e}")
            return
        
        # Process menu items
        dishes_added = 0
        for day in data.get("days", []):
            day_date = day.get("date")
            if not day_date:
                continue
            
            # Get station names for better categorization
            stations = day.get("stations", {})
            station_names = {}
            if isinstance(stations, list):
                for s in stations:
                    sid = s.get("id")
                    name = s.get("name")
                    if sid is not None and name:
                        station_names[sid] = name
            elif isinstance(stations, dict):
                for k, v in stations.items():
                    try:
                        sid = int(k)
                    except (TypeError, ValueError):
                        sid = k
                    if isinstance(v, dict):
                        name = v.get("name")
                    else:
                        name = v
                    if sid is not None and name:
                        station_names[sid] = name
            
            # Process menu items
            for mi in day.get("menu_items", []):
                if mi.get("is_section_title"):
                    continue
                
                food = mi.get("food")
                if not food:
                    continue
                
                item_name = food.get("name", "Unnamed Item")
                item_description = food.get("description", "")
                
                # Determine category
                category = self.determine_category(item_name, mi, station_names)
                
                # Create or get dish
                dish_id = self.get_or_create_dish(item_name, category, item_description)
                
                # Link dish to menu
                self.link_menu_dish(menu_id, dish_id)
                dishes_added += 1
        
        print(f"Added {dishes_added} dishes to menu")
        return menu_id
    
    def determine_category(self, item_name: str, menu_item: dict, station_names: dict) -> str:
        """Determine the category of a food item"""
        
        # Check if we have meaningful station data
        station_id = menu_item.get("station_id")
        if station_id and station_id in station_names:
            station_name = station_names[station_id]
            # Map station names to categories
            station_category_map = {
                'main': 'Main Dishes',
                'entree': 'Main Dishes',
                'side': 'Sides & Vegetables',
                'vegetable': 'Sides & Vegetables',
                'salad': 'Soups & Salads',
                'soup': 'Soups & Salads',
                'dessert': 'Desserts & Sweets',
                'bread': 'Breads & Pastries',
                'beverage': 'Beverages & Dairy',
                'dairy': 'Beverages & Dairy'
            }
            
            for keyword, category in station_category_map.items():
                if keyword in station_name.lower():
                    return category
        
        # Fallback to intelligent categorization
        return self.categorize_food_item(item_name)
    
    def categorize_food_item(self, item_name: str) -> str:
        """Categorize a single food item using intelligent logic"""
        item_lower = item_name.lower()
        
        # Priority-based categorization
        if self.is_dessert_item(item_name):
            return 'Desserts & Sweets'
        elif self.is_main_dish(item_name):
            return 'Main Dishes'
        elif any(keyword in item_lower for keyword in ['soup', 'salad', 'chowder']):
            return 'Soups & Salads'
        elif any(keyword in item_lower for keyword in ['bread', 'roll', 'muffin', 'biscuit']):
            return 'Breads & Pastries'
        elif any(keyword in item_lower for keyword in ['egg', 'tofu', 'protein']):
            return 'Eggs & Proteins'
        elif any(keyword in item_lower for keyword in ['apple', 'banana', 'orange', 'grape', 'berry']):
            return 'Fruits'
        elif any(keyword in item_lower for keyword in ['cheese', 'milk', 'cream', 'yogurt']):
            return 'Beverages & Dairy'
        elif any(keyword in item_lower for keyword in ['sauce', 'dressing', 'dip', 'mayo', 'mustard']):
            return 'Condiments & Toppings'
        else:
            return 'Main Dishes'  # Default fallback
    
    def is_dessert_item(self, item_name: str) -> bool:
        """Check if an item is likely a dessert"""
        item_lower = item_name.lower()
        dessert_words = [
            'cake', 'pie', 'cookie', 'brownie', 'cupcake', 'pudding', 'tart', 'donut',
            'fritter', 'shortcake', 'blondie', 'velvet', 'chocolate', 'vanilla',
            'key lime', 'carrot', 'coconut', 'oatmeal', 'sugar', 'triple', 'golden'
        ]
        return any(word in item_lower for word in dessert_words)
    
    def is_main_dish(self, item_name: str) -> bool:
        """Check if an item is likely a main dish"""
        item_lower = item_name.lower()
        main_dish_words = [
            'pizza', 'burger', 'sandwich', 'hot dog', 'hamburger', 'chicken', 'beef', 'pork',
            'fish', 'salmon', 'pasta', 'spaghetti', 'lasagna', 'burrito', 'taco', 'calzone',
            'rotisserie', 'grilled', 'fried', 'baked', 'roasted', 'sausage', 'bacon', 'ham',
            'turkey', 'ribs', 'medallions', 'loin', 'thighs', 'breast', 'wings'
        ]
        return any(word in item_lower for word in main_dish_words)
    
    def get_menu_summary(self, venue_id: int = None) -> Dict:
        """Get summary statistics from the database"""
        summary = {}
        
        # Total venues
        self.cursor.execute("SELECT COUNT(*) FROM Venue")
        summary['total_venues'] = self.cursor.fetchone()[0]
        
        # Total menus
        if venue_id:
            self.cursor.execute("SELECT COUNT(*) FROM Menu WHERE venue_id = ?", (venue_id,))
            summary['total_menus'] = self.cursor.fetchone()[0]
        else:
            self.cursor.execute("SELECT COUNT(*) FROM Menu")
            summary['total_menus'] = self.cursor.fetchone()[0]
        
        # Total dishes
        self.cursor.execute("SELECT COUNT(*) FROM Dish")
        summary['total_dishes'] = self.cursor.fetchone()[0]
        
        # Dishes by category
        self.cursor.execute("""
            SELECT category, COUNT(*) 
            FROM Dish 
            GROUP BY category 
            ORDER BY COUNT(*) DESC
        """)
        summary['dishes_by_category'] = dict(self.cursor.fetchall())
        
        return summary
    
    def close_connection(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

def main():
    """Main function to run the enhanced menu scraper"""
    
    # Initialize database scraper
    scraper = MenuScraperDatabase()
    scraper.connect_database()
    
    try:
        # Get user input
        district = input("Enter the district (e.g., gsu): ").strip()
        school = input("Enter the school (e.g., piedmont-central): ").strip()
        menu_type = input("Enter menu type (breakfast, lunch, dinner): ").strip().lower()
        date_str = input("Enter date (YYYY/MM/DD): ").strip()
        
        if menu_type not in ["breakfast", "lunch", "dinner"]:
            print("Invalid menu type. Please enter breakfast, lunch, or dinner.")
            return
        
        print(f"\nFetching and storing menu data...")
        print(f"District: {district}")
        print(f"School: {school}")
        print(f"Menu Type: {menu_type}")
        print(f"Date: {date_str}")
        
        # Fetch and store menu data
        menu_id = scraper.fetch_and_store_menu(district, school, menu_type, date_str)
        
        if menu_id:
            print(f"\n✅ Successfully stored menu data!")
            print(f"Menu ID: {menu_id}")
            
            # Get venue ID for summary
            scraper.cursor.execute(
                "SELECT venue_id FROM Menu WHERE menu_id = ?", (menu_id,)
            )
            venue_id = scraper.cursor.fetchone()[0]
            
            # Display summary
            summary = scraper.get_menu_summary(venue_id)
            print(f"\n📊 Database Summary:")
            print(f"Total Venues: {summary['total_venues']}")
            print(f"Total Menus: {summary['total_menus']}")
            print(f"Total Dishes: {summary['total_dishes']}")
            print(f"\nDishes by Category:")
            for category, count in summary['dishes_by_category'].items():
                print(f"  {category}: {count}")
        else:
            print("❌ Failed to store menu data")
    
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        scraper.close_connection()

if __name__ == "__main__":
    main()
