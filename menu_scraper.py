import requests
from collections import defaultdict
import re

def categorize_food_items(items):
    """
    Automatically categorize food items based on their names since 
    the API doesn't provide meaningful sections for breakfast
    """
    categories = {
        'Main Dishes': [],
        'Eggs & Proteins': [],
        'Breads & Pastries': [],
        'Sides & Vegetables': [],
        'Fruits': [],
        'Beverages & Dairy': [], 
        'Condiments & Toppings': []
    }
    
    # Define keywords for each category
    main_keywords = ['burrito', 'casserole', 'frittata', 'pancakes', 'toast', 'sausage', 'bacon', 'hash']
    egg_keywords = ['egg', 'scrambled', 'hardboiled', 'liquid']
    bread_keywords = ['bagel', 'muffin', 'biscuit', 'danish', 'scone', 'roll', 'donut', 'tart', 'turnover', 'bar']
    side_keywords = ['grits', 'tots', 'broccoli', 'pepper', 'onion', 'spinach', 'mushroom', 'gravy']
    fruit_keywords = ['fruit', 'berry', 'mango', 'cocktail']
    dairy_keywords = ['yogurt', 'cheese', 'cream', 'milk']
    condiment_keywords = ['jelly', 'salsa', 'sour cream', 'substitute']
    
    for item in items:
        item_lower = item.lower()
        categorized = False
        
        # Check each category
        if any(keyword in item_lower for keyword in main_keywords):
            categories['Main Dishes'].append(item)
            categorized = True
        elif any(keyword in item_lower for keyword in egg_keywords):
            categories['Eggs & Proteins'].append(item)
            categorized = True
        elif any(keyword in item_lower for keyword in bread_keywords):
            categories['Breads & Pastries'].append(item)
            categorized = True
        elif any(keyword in item_lower for keyword in side_keywords):
            categories['Sides & Vegetables'].append(item)
            categorized = True
        elif any(keyword in item_lower for keyword in fruit_keywords):
            categories['Fruits'].append(item)
            categorized = True
        elif any(keyword in item_lower for keyword in dairy_keywords):
            categories['Beverages & Dairy'].append(item)
            categorized = True
        elif any(keyword in item_lower for keyword in condiment_keywords):
            categories['Condiments & Toppings'].append(item)
            categorized = True
        
        # If not categorized, put in appropriate default
        if not categorized:
            if 'granola' in item_lower:
                categories['Breads & Pastries'].append(item)
            else:
                categories['Main Dishes'].append(item)
    
    # Remove empty categories
    return {k: v for k, v in categories.items() if v}

def fetch_menu_for_database(district, school, menu_type, date_str):
    """
    Fetch menu data and return structured format for database insertion
    """
    url = f"https://{district}.api.nutrislice.com/menu/api/weeks/school/{school}/menu-type/{menu_type}/{date_str}?format=json"
    
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Failed to fetch menu: {e}")
        return {}

    def normalize_station_map(stations):
        if not stations:
            return {}
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
        return station_names

    result = {}

    for day in data.get("days", []):
        date = day.get("date")
        if not date:
            continue
            
        station_names = normalize_station_map(day.get("stations"))
        
        # Check if we have meaningful station data
        has_station_ids = any(
            isinstance(mi.get("station_id"), (int, str)) and mi.get("station_id") in station_names
            for mi in day.get("menu_items", [])
            if mi.get("food")
        )

        daily_items = []
        current_section_from_title = None

        for mi in day.get("menu_items", []):
            if mi.get("is_section_title"):
                current_section_from_title = mi.get("text") or "Unnamed Section"
                continue

            food = mi.get("food")
            if not food:
                continue

            section = "General"
            if has_station_ids:
                sid = mi.get("station_id")
                if sid in station_names:
                    section = station_names[sid]
            elif current_section_from_title:
                section = current_section_from_title

            item_name = food.get("name", "Unnamed Item")
            daily_items.append(item_name)

        # If everything is in General (no meaningful sections), auto-categorize
        if daily_items:
            if not has_station_ids and not current_section_from_title:
                # Auto-categorize the items
                categorized = categorize_food_items(daily_items)
                result[date] = {
                    'menu_type': menu_type,
                    'sections': categorized,
                    'total_items': len(daily_items)
                }
            else:
                # Use existing sections
                result[date] = {
                    'menu_type': menu_type,
                    'sections': {'General': daily_items},
                    'total_items': len(daily_items)
                }

    return result

def prepare_database_records(menu_data):
    """
    Convert menu data into database-ready records
    """
    menu_records = []
    section_records = []
    item_records = []
    
    menu_id = 1  # You'd generate this properly
    
    for date, day_data in menu_data.items():
        # Menu table record
        menu_record = {
            'id': menu_id,
            'date': date,
            'menu_type': day_data['menu_type'],
            'total_items': day_data['total_items']
        }
        menu_records.append(menu_record)
        
        section_id = 1
        for section_name, items in day_data['sections'].items():
            # Section table record
            section_record = {
                'id': section_id,
                'menu_id': menu_id,
                'name': section_name,
                'item_count': len(items)
            }
            section_records.append(section_record)
            
            # Item table records  
            for item_name in items:
                item_record = {
                    'menu_id': menu_id,
                    'section_id': section_id,
                    'name': item_name
                }
                item_records.append(item_record)
            
            section_id += 1
        menu_id += 1
    
    return {
        'menus': menu_records,
        'sections': section_records, 
        'items': item_records
    }

def main():
    district = input("Enter the district (e.g., gsu): ").strip()
    school = input("Enter the school (e.g., piedmont-central): ").strip()
    menu_type = input("Enter menu type (breakfast, lunch, dinner): ").strip().lower()
    date_str = input("Enter date (YYYY/MM/DD): ").strip()

    if menu_type not in ["breakfast", "lunch", "dinner"]:
        print("Invalid menu type. Please enter breakfast, lunch, or dinner.")
        return

    # Fetch structured menu data
    menu_data = fetch_menu_for_database(district, school, menu_type, date_str)
    
    if not menu_data:
        print("No menu data found")
        return
    
    # Display organized menu
    for date, day_data in menu_data.items():
        print(f"\n=== Menu for {date} ({day_data['menu_type'].title()}) ===")
        for section, items in day_data['sections'].items():
            print(f"\n{section}:")
            for item in items:
                print(f"  - {item}")
    
    # Prepare database records
    db_records = prepare_database_records(menu_data)
    
    print(f"\n=== Database Records ===")
    print(f"Menus: {len(db_records['menus'])} records")
    print(f"Sections: {len(db_records['sections'])} records") 
    print(f"Items: {len(db_records['items'])} records")
    
    # You can now insert these records into your database
    # Example:
    # for menu in db_records['menus']:
    #     cursor.execute("INSERT INTO menus (...) VALUES (...)", menu)
    # for section in db_records['sections']:
    #     cursor.execute("INSERT INTO sections (...) VALUES (...)", section)
    # for item in db_records['items']:
    #     cursor.execute("INSERT INTO items (...) VALUES (...)", item)
    
    return db_records

if __name__ == "__main__":
    main()
