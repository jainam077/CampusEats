#!/usr/bin/env python3
"""
Script to create missing tables in your MySQL database
"""
import mysql.connector
from mysql.connector import Error
import json

def create_missing_tables():
    """Create the missing MenuDish table"""
    
    # Load database configuration
    with open("db_config.json", "r") as f:
        config = json.load(f)
    
    mysql_config = config["mysql"]
    
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host=mysql_config['host'],
            database=mysql_config['database'],
            user=mysql_config['user'],
            password=mysql_config['password'],
            port=mysql_config['port']
        )
        cursor = conn.cursor()
        
        print("✅ Connected to database successfully!")
        
        # Create MenuDish table
        create_menudish_table = """
        CREATE TABLE IF NOT EXISTS MenuDish (
            menu_id INT NOT NULL,
            dish_id INT NOT NULL,
            PRIMARY KEY (menu_id, dish_id),
            FOREIGN KEY (menu_id) REFERENCES Menu(menu_id) ON DELETE CASCADE,
            FOREIGN KEY (dish_id) REFERENCES Dish(dish_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        cursor.execute(create_menudish_table)
        conn.commit()
        print("✅ MenuDish table created successfully!")
        
        # Check if tables exist
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"\n📋 Current tables in database:")
        for table in tables:
            print(f"  - {table}")
        
        # Check if we have the required tables
        required_tables = ['User', 'Venue', 'Menu', 'Dish', 'MenuDish']
        missing_tables = [table for table in required_tables if table not in tables]
        
        if missing_tables:
            print(f"\n⚠️  Missing tables: {missing_tables}")
        else:
            print(f"\n✅ All required tables exist!")
        
        cursor.close()
        conn.close()
        print("\n🎉 Database setup complete!")
        
    except Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_missing_tables()
