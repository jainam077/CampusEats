import sqlite3
import json
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional

class DatabaseManager:
    """
    Utility class for managing the menu database
    """
    
    def __init__(self, db_path: str = "menu_database.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
    
    def connect(self):
        """Connect to the database"""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute("PRAGMA foreign_keys = ON")  # Enable foreign key constraints
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def get_all_venues(self) -> List[Dict]:
        """Get all venues"""
        self.cursor.execute("SELECT * FROM Venue ORDER BY name")
        columns = [description[0] for description in self.cursor.description]
        return [dict(zip(columns, row)) for row in self.cursor.fetchall()]
    
    def get_venue_menus(self, venue_id: int) -> List[Dict]:
        """Get all menus for a specific venue"""
        self.cursor.execute("""
            SELECT m.*, v.name as venue_name 
            FROM Menu m 
            JOIN Venue v ON m.venue_id = v.venue_id 
            WHERE m.venue_id = ? 
            ORDER BY m.date DESC, m.meal_type
        """, (venue_id,))
        columns = [description[0] for description in self.cursor.description]
        return [dict(zip(columns, row)) for row in self.cursor.fetchall()]
    
    def get_menu_dishes(self, menu_id: int) -> List[Dict]:
        """Get all dishes for a specific menu"""
        self.cursor.execute("""
            SELECT d.*, md.menu_id 
            FROM Dish d 
            JOIN MenuDish md ON d.dish_id = md.dish_id 
            WHERE md.menu_id = ? 
            ORDER BY d.category, d.name
        """, (menu_id,))
        columns = [description[0] for description in self.cursor.description]
        return [dict(zip(columns, row)) for row in self.cursor.fetchall()]
    
    def get_dishes_by_category(self, category: str = None) -> List[Dict]:
        """Get dishes, optionally filtered by category"""
        if category:
            self.cursor.execute("SELECT * FROM Dish WHERE category = ? ORDER BY name", (category,))
        else:
            self.cursor.execute("SELECT * FROM Dish ORDER BY category, name")
        
        columns = [description[0] for description in self.cursor.description]
        return [dict(zip(columns, row)) for row in self.cursor.fetchall()]
    
    def get_database_stats(self) -> Dict:
        """Get comprehensive database statistics"""
        stats = {}
        
        # Basic counts
        tables = ['User', 'Venue', 'Menu', 'Dish', 'Review', 'Photo', 'DietaryTag', 'Report', 'AdminAction']
        for table in tables:
            self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[f'{table.lower()}_count'] = self.cursor.fetchone()[0]
        
        # Dishes by category
        self.cursor.execute("""
            SELECT category, COUNT(*) as count 
            FROM Dish 
            GROUP BY category 
            ORDER BY count DESC
        """)
        stats['dishes_by_category'] = dict(self.cursor.fetchall())
        
        # Menus by meal type
        self.cursor.execute("""
            SELECT meal_type, COUNT(*) as count 
            FROM Menu 
            GROUP BY meal_type 
            ORDER BY count DESC
        """)
        stats['menus_by_meal_type'] = dict(self.cursor.fetchall())
        
        # Recent activity
        self.cursor.execute("""
            SELECT COUNT(*) 
            FROM Menu 
            WHERE date >= date('now', '-7 days')
        """)
        stats['recent_menus'] = self.cursor.fetchone()[0]
        
        return stats
    
    def search_dishes(self, search_term: str) -> List[Dict]:
        """Search for dishes by name or description"""
        self.cursor.execute("""
            SELECT * FROM Dish 
            WHERE name LIKE ? OR description LIKE ?
            ORDER BY name
        """, (f'%{search_term}%', f'%{search_term}%'))
        
        columns = [description[0] for description in self.cursor.description]
        return [dict(zip(columns, row)) for row in self.cursor.fetchall()]
    
    def export_menu_data(self, venue_id: int = None, output_file: str = None) -> Dict:
        """Export menu data to JSON format"""
        export_data = {
            'export_timestamp': datetime.now().isoformat(),
            'venues': [],
            'menus': [],
            'dishes': []
        }
        
        # Get venues
        if venue_id:
            self.cursor.execute("SELECT * FROM Venue WHERE venue_id = ?", (venue_id,))
        else:
            self.cursor.execute("SELECT * FROM Venue")
        
        venues = self.cursor.fetchall()
        venue_columns = [description[0] for description in self.cursor.description]
        
        for venue in venues:
            venue_dict = dict(zip(venue_columns, venue))
            export_data['venues'].append(venue_dict)
            
            # Get menus for this venue
            self.cursor.execute("SELECT * FROM Menu WHERE venue_id = ?", (venue[0],))
            menus = self.cursor.fetchall()
            menu_columns = [description[0] for description in self.cursor.description]
            
            for menu in menus:
                menu_dict = dict(zip(menu_columns, menu))
                export_data['menus'].append(menu_dict)
                
                # Get dishes for this menu
                self.cursor.execute("""
                    SELECT d.* FROM Dish d 
                    JOIN MenuDish md ON d.dish_id = md.dish_id 
                    WHERE md.menu_id = ?
                """, (menu[0],))
                dishes = self.cursor.fetchall()
                dish_columns = [description[0] for description in self.cursor.description]
                
                for dish in dishes:
                    dish_dict = dict(zip(dish_columns, dish))
                    if dish_dict not in export_data['dishes']:  # Avoid duplicates
                        export_data['dishes'].append(dish_dict)
        
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            print(f"Data exported to {output_file}")
        
        return export_data
    
    def cleanup_orphaned_data(self):
        """Remove orphaned data (dishes not linked to any menu)"""
        # Find dishes not linked to any menu
        self.cursor.execute("""
            SELECT d.dish_id, d.name 
            FROM Dish d 
            LEFT JOIN MenuDish md ON d.dish_id = md.dish_id 
            WHERE md.dish_id IS NULL
        """)
        orphaned_dishes = self.cursor.fetchall()
        
        if orphaned_dishes:
            print(f"Found {len(orphaned_dishes)} orphaned dishes:")
            for dish_id, name in orphaned_dishes:
                print(f"  - {name} (ID: {dish_id})")
            
            confirm = input("Delete orphaned dishes? (y/N): ").strip().lower()
            if confirm == 'y':
                self.cursor.execute("DELETE FROM Dish WHERE dish_id IN (SELECT d.dish_id FROM Dish d LEFT JOIN MenuDish md ON d.dish_id = md.dish_id WHERE md.dish_id IS NULL)")
                self.conn.commit()
                print(f"Deleted {len(orphaned_dishes)} orphaned dishes")
        else:
            print("No orphaned dishes found")

def main():
    """Interactive database management interface"""
    db_manager = DatabaseManager()
    db_manager.connect()
    
    try:
        while True:
            print("\n" + "="*50)
            print("DATABASE MANAGEMENT INTERFACE")
            print("="*50)
            print("1. View all venues")
            print("2. View venue menus")
            print("3. View menu dishes")
            print("4. Search dishes")
            print("5. View database statistics")
            print("6. Export data to JSON")
            print("7. Cleanup orphaned data")
            print("8. Exit")
            
            choice = input("\nSelect an option (1-8): ").strip()
            
            if choice == '1':
                venues = db_manager.get_all_venues()
                print(f"\nFound {len(venues)} venues:")
                for venue in venues:
                    print(f"  ID: {venue['venue_id']} | {venue['name']} | {venue['location']}")
            
            elif choice == '2':
                venue_id = input("Enter venue ID: ").strip()
                try:
                    venue_id = int(venue_id)
                    menus = db_manager.get_venue_menus(venue_id)
                    print(f"\nFound {len(menus)} menus:")
                    for menu in menus:
                        print(f"  ID: {menu['menu_id']} | {menu['date']} | {menu['meal_type']} | {menu['venue_name']}")
                except ValueError:
                    print("Invalid venue ID")
            
            elif choice == '3':
                menu_id = input("Enter menu ID: ").strip()
                try:
                    menu_id = int(menu_id)
                    dishes = db_manager.get_menu_dishes(menu_id)
                    print(f"\nFound {len(dishes)} dishes:")
                    for dish in dishes:
                        print(f"  {dish['name']} | {dish['category']}")
                except ValueError:
                    print("Invalid menu ID")
            
            elif choice == '4':
                search_term = input("Enter search term: ").strip()
                dishes = db_manager.search_dishes(search_term)
                print(f"\nFound {len(dishes)} dishes matching '{search_term}':")
                for dish in dishes:
                    print(f"  {dish['name']} | {dish['category']}")
            
            elif choice == '5':
                stats = db_manager.get_database_stats()
                print("\nDATABASE STATISTICS:")
                print(f"Users: {stats['user_count']}")
                print(f"Venues: {stats['venue_count']}")
                print(f"Menus: {stats['menu_count']}")
                print(f"Dishes: {stats['dish_count']}")
                print(f"Reviews: {stats['review_count']}")
                print(f"Photos: {stats['photo_count']}")
                print(f"Reports: {stats['report_count']}")
                print(f"Admin Actions: {stats['adminaction_count']}")
                
                print("\nDISHES BY CATEGORY:")
                for category, count in stats['dishes_by_category'].items():
                    print(f"  {category}: {count}")
                
                print("\nMENUS BY MEAL TYPE:")
                for meal_type, count in stats['menus_by_meal_type'].items():
                    print(f"  {meal_type}: {count}")
                
                print(f"\nRecent menus (last 7 days): {stats['recent_menus']}")
            
            elif choice == '6':
                venue_id = input("Enter venue ID (or press Enter for all venues): ").strip()
                output_file = input("Enter output filename (or press Enter for default): ").strip()
                
                venue_id = int(venue_id) if venue_id else None
                output_file = output_file if output_file else f"menu_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                
                db_manager.export_menu_data(venue_id, output_file)
            
            elif choice == '7':
                db_manager.cleanup_orphaned_data()
            
            elif choice == '8':
                print("Goodbye!")
                break
            
            else:
                print("Invalid option. Please try again.")
    
    except KeyboardInterrupt:
        print("\nExiting...")
    
    finally:
        db_manager.close()

if __name__ == "__main__":
    main()
