import requests
import mysql.connector
from mysql.connector import Error
from datetime import datetime, date
import json
import os

class MenuScraperSimple:
    """
    Simplified menu scraper for existing MySQL database
    """
    
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.config = self.load_config()
    
    def load_config(self):
        """Load database configuration"""
        config_file = "db_config.json"
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        # Default configuration
        return {
            "mysql": {
                "host": "localhost",
                "port": 3306,
                "database": "CampusEats",
                "user": "root",
                "password": "jainam1815"
            }
        }
        
    def connect_database(self):
        """Connect to MySQL database using configuration"""
        mysql_config = self.config.get("mysql", {})
        
        try:
            self.conn = mysql.connector.connect(
                host=mysql_config['host'],
                database=mysql_config['database'],
                user=mysql_config['user'],
                password=mysql_config['password'],
                port=mysql_config['port'],
                autocommit=False
            )
            self.cursor = self.conn.cursor(dictionary=True)
            print("✅ Successfully connected to MySQL database!")
            return True
        except Error as e:
            print(f"❌ Error connecting to MySQL: {e}")
            print("Please run: python database_config.py to setup your database connection")
            return False
    
    def get_or_create_venue(self, district: str, school: str) -> int:
        """Get or create venue and return venue_id"""
        venue_name = f"{district.upper()} - {school.replace('-', ' ').title()}"
        location = f"{district} District"
        
        # Check if venue exists
        query = "SELECT venue_id FROM Venue WHERE name = %s AND location = %s"
        self.cursor.execute(query, (venue_name, location))
        result = self.cursor.fetchone()
        
        if result:
            return result['venue_id']
        
        # Create new venue
        query = "INSERT INTO Venue (name, location, hours) VALUES (%s, %s, %s)"
        self.cursor.execute(query, (venue_name, location, "Hours not specified"))
        self.conn.commit()
        return self.cursor.lastrowid
    
    def get_or_create_menu(self, venue_id: int, date_str: str, meal_type: str) -> int:
        """Get or create menu and return menu_id"""
        try:
            menu_date = datetime.strptime(date_str, "%Y/%m/%d").date()
        except ValueError:
            print(f"Invalid date format: {date_str}")
            return None
        
        # Check if menu exists
        query = "SELECT menu_id FROM Menu WHERE venue_id = %s AND date = %s AND meal_type = %s"
        self.cursor.execute(query, (venue_id, menu_date, meal_type))
        result = self.cursor.fetchone()
        
        if result:
            return result['menu_id']
        
        # Create new menu
        query = "INSERT INTO Menu (venue_id, date, meal_type) VALUES (%s, %s, %s)"
        self.cursor.execute(query, (venue_id, menu_date, meal_type))
        self.conn.commit()
        return self.cursor.lastrowid
    
    def get_or_create_dish(self, name: str, category: str, description: str = None) -> int:
        """Get or create dish and return dish_id"""
        # Check if dish exists
        query = "SELECT dish_id FROM Dish WHERE name = %s"
        self.cursor.execute(query, (name,))
        result = self.cursor.fetchone()
        
        if result:
            return result['dish_id']
        
        # Create new dish
        query = "INSERT INTO Dish (name, description, category) VALUES (%s, %s, %s)"
        self.cursor.execute(query, (name, description, category))
        self.conn.commit()
        return self.cursor.lastrowid
    
    def link_menu_dish(self, menu_id: int, dish_id: int):
        """Link a dish to a menu"""
        try:
            query = "INSERT INTO MenuDish (menu_id, dish_id) VALUES (%s, %s)"
            self.cursor.execute(query, (menu_id, dish_id))
            self.conn.commit()
        except Error as e:
            if "Duplicate entry" not in str(e):
                print(f"Warning: {e}")
    
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
            return 'Main Dishes'
    
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
    
    def fetch_and_store_menu(self, district: str, school: str, menu_type: str, date_str: str):
        """Fetch menu data and store in database"""
        
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
            for mi in day.get("menu_items", []):
                if mi.get("is_section_title"):
                    continue
                
                food = mi.get("food")
                if not food:
                    continue
                
                item_name = food.get("name", "Unnamed Item")
                item_description = food.get("description", "")
                category = self.categorize_food_item(item_name)
                
                # Create or get dish
                dish_id = self.get_or_create_dish(item_name, category, item_description)
                
                # Link dish to menu
                self.link_menu_dish(menu_id, dish_id)
                dishes_added += 1
        
        print(f"Added {dishes_added} dishes to menu")
        return menu_id
    
    def get_summary(self) -> dict:
        """Get database summary"""
        summary = {}
        
        # Total venues
        self.cursor.execute("SELECT COUNT(*) as count FROM Venue")
        summary['total_venues'] = self.cursor.fetchone()['count']
        
        # Total menus
        self.cursor.execute("SELECT COUNT(*) as count FROM Menu")
        summary['total_menus'] = self.cursor.fetchone()['count']
        
        # Total dishes
        self.cursor.execute("SELECT COUNT(*) as count FROM Dish")
        summary['total_dishes'] = self.cursor.fetchone()['count']
        
        # Dishes by category
        self.cursor.execute("""
            SELECT category, COUNT(*) as count 
            FROM Dish 
            GROUP BY category 
            ORDER BY count DESC
        """)
        summary['dishes_by_category'] = dict(self.cursor.fetchall())
        
        return summary
    
    def close_connection(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()

def main():
    """Main function"""
    scraper = MenuScraperSimple()
    
    if not scraper.connect_database():
        return
    
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
        
        # Fetch and store menu data
        menu_id = scraper.fetch_and_store_menu(district, school, menu_type, date_str)
        
        if menu_id:
            print(f"\n✅ Successfully stored menu data!")
            print(f"Menu ID: {menu_id}")
            
            # Display summary
            summary = scraper.get_summary()
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
