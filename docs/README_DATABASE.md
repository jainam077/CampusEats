# Menu Scraper Database Integration

This project provides enhanced menu scraping capabilities that integrate with your existing MySQL database according to the ERD schema.

## 📁 Files Overview

### Core Scripts
- **`menu_scraper_simple.py`** - Main script for scraping and storing data (RECOMMENDED)
- **`menu_scraper_mysql.py`** - Full-featured MySQL integration script
- **`database_config.py`** - Configuration management for database connections
- **`menu_scraper.py`** - Original script (improved categorization)

### Database Management
- **`database_manager.py`** - Database management and querying utilities

## 🚀 Quick Start

### 1. Setup Database Configuration

First, configure your MySQL database connection:

```bash
python database_config.py
```

This will create a `db_config.json` file with your database settings.

### 2. Run the Menu Scraper

```bash
python menu_scraper_simple.py
```

The script will:
- Connect to your MySQL database
- Prompt for district, school, menu type, and date
- Fetch menu data from Nutrislice API
- Store data according to your ERD schema
- Display summary statistics

## 🗄️ Database Schema Integration

The script automatically handles the following tables according to your ERD:

### Core Tables
- **`Venue`** - Stores restaurant/cafeteria information
- **`Menu`** - Stores menu information (date, meal type)
- **`Dish`** - Stores individual food items with categories
- **`MenuDish`** - Junction table linking menus to dishes

### Additional Tables (for future use)
- **`User`** - User accounts
- **`Review`** - User reviews of dishes
- **`Photo`** - Photos associated with reviews
- **`DietaryTag`** - Dietary restriction tags
- **`ReviewDietaryTag`** - Links reviews to dietary tags
- **`Report`** - User reports
- **`AdminAction`** - Administrative actions

## 📊 Data Flow

```
Nutrislice API → Menu Scraper → MySQL Database
     ↓                ↓              ↓
  Raw JSON    →  Processed Data  →  Structured Tables
```

### Data Processing Steps:
1. **Fetch** menu data from Nutrislice API
2. **Categorize** food items intelligently
3. **Create/Update** Venue records
4. **Create/Update** Menu records
5. **Create/Update** Dish records
6. **Link** dishes to menus via MenuDish table

## 🎯 Smart Categorization

The script uses intelligent categorization to organize food items:

- **Desserts & Sweets** - Cakes, pies, cookies, etc.
- **Main Dishes** - Pizza, burgers, meat, fish, pasta
- **Soups & Salads** - All soups and salad items
- **Sides & Vegetables** - Vegetables, rice, potatoes
- **Breads & Pastries** - Breads, rolls, crackers
- **Eggs & Proteins** - Eggs, tofu, protein items
- **Fruits** - Fresh fruits and fruit items
- **Beverages & Dairy** - Cheese, dairy products
- **Condiments & Toppings** - Sauces, dressings, toppings

## 🔧 Database Management

### View Data in DBeaver
After running the scraper, you can view the data in DBeaver:

```sql
-- View all venues
SELECT * FROM Venue;

-- View menus for a specific venue
SELECT m.*, v.name as venue_name 
FROM Menu m 
JOIN Venue v ON m.venue_id = v.venue_id 
WHERE v.name LIKE '%GSU%';

-- View dishes for a specific menu
SELECT d.*, md.menu_id 
FROM Dish d 
JOIN MenuDish md ON d.dish_id = md.dish_id 
WHERE md.menu_id = 1;

-- View dishes by category
SELECT category, COUNT(*) as count 
FROM Dish 
GROUP BY category 
ORDER BY count DESC;
```

### Database Management Script
Use the database manager for advanced operations:

```bash
python database_manager.py
```

Features:
- View all venues and menus
- Search dishes
- Export data to JSON
- View database statistics
- Cleanup orphaned data

## 📈 Example Usage

### Basic Scraping
```bash
$ python menu_scraper_simple.py
Enter the district (e.g., gsu): gsu
Enter the school (e.g., piedmont-central): piedmont-central
Enter menu type (breakfast, lunch, dinner): dinner
Enter date (YYYY/MM/DD): 2025/10/20

✅ Successfully connected to MySQL database!
Venue ID: 1
Menu ID: 1
Added 45 dishes to menu

✅ Successfully stored menu data!
Menu ID: 1

📊 Database Summary:
Total Venues: 1
Total Menus: 1
Total Dishes: 45

Dishes by Category:
Main Dishes: 20
Desserts & Sweets: 8
Sides & Vegetables: 10
Beverages & Dairy: 4
Condiments & Toppings: 3
```

### Batch Processing
You can create a batch script to scrape multiple dates:

```python
# batch_scraper.py
from menu_scraper_simple import MenuScraperSimple
from datetime import datetime, timedelta

scraper = MenuScraperSimple()
if scraper.connect_database():
    # Scrape last 7 days
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y/%m/%d")
        scraper.fetch_and_store_menu("gsu", "piedmont-central", "dinner", date)
    scraper.close_connection()
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection Error**
   ```
   ❌ Error connecting to MySQL: Access denied for user 'root'@'localhost'
   ```
   - Check your database credentials in `db_config.json`
   - Ensure MySQL server is running
   - Verify user permissions

2. **Table Not Found**
   ```
   Table 'menu_database.Venue' doesn't exist
   ```
   - Ensure your database has the correct schema
   - Check table names match the ERD exactly

3. **API Errors**
   ```
   Failed to fetch menu: 404 Client Error
   ```
   - Verify district and school names
   - Check if the date is valid
   - Ensure the API endpoint is accessible

### Debug Mode
Add debug logging to see detailed information:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📋 Requirements

- Python 3.7+
- MySQL database with ERD schema
- Internet connection for API access
- Required packages:
  - `requests`
  - `mysql-connector-python`

## 🎯 Next Steps

1. **Setup** your database configuration
2. **Test** with a single menu scrape
3. **Verify** data in DBeaver
4. **Scale** to multiple venues and dates
5. **Integrate** with your application

## 📞 Support

If you encounter issues:
1. Check the database connection settings
2. Verify your ERD schema matches the expected structure
3. Test with a simple query in DBeaver
4. Check the API endpoint manually

The scripts are designed to be robust and handle common edge cases, but database-specific issues may require adjustment based on your exact schema implementation.
