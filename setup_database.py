#!/usr/bin/env python3
"""
Simple database setup script
"""
import json
import os

def setup_database():
    """Setup database configuration interactively"""
    print("🔧 Database Configuration Setup")
    print("=" * 40)
    print("Please enter your MySQL database connection details:")
    print()
    
    # Get connection details
    host = input("MySQL host [localhost]: ").strip() or "localhost"
    port = input("MySQL port [3306]: ").strip() or "3306"
    database = input("Database name: ").strip()
    user = input("Username: ").strip()
    password = input("Password: ").strip()
    
    # Create configuration
    config = {
        "mysql": {
            "host": host,
            "port": int(port),
            "database": database,
            "user": user,
            "password": password
        },
        "connection_timeout": 30,
        "max_retries": 3
    }
    
    # Save configuration
    try:
        with open("db_config.json", "w") as f:
            json.dump(config, f, indent=2)
        print(f"\n✅ Configuration saved to db_config.json")
        print(f"Host: {host}:{port}")
        print(f"Database: {database}")
        print(f"User: {user}")
        return True
    except Exception as e:
        print(f"❌ Error saving configuration: {e}")
        return False

def test_connection():
    """Test database connection"""
    try:
        import mysql.connector
        from mysql.connector import Error
        
        # Load configuration
        with open("db_config.json", "r") as f:
            config = json.load(f)
        
        mysql_config = config["mysql"]
        
        # Test connection
        conn = mysql.connector.connect(
            host=mysql_config['host'],
            database=mysql_config['database'],
            user=mysql_config['user'],
            password=mysql_config['password'],
            port=mysql_config['port']
        )
        
        if conn.is_connected():
            print("✅ Database connection successful!")
            conn.close()
            return True
        else:
            print("❌ Database connection failed!")
            return False
            
    except Error as e:
        print(f"❌ Database connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main setup function"""
    print("Welcome to Menu Scraper Database Setup!")
    print()
    
    # Check if config already exists
    if os.path.exists("db_config.json"):
        print("Configuration file already exists.")
        overwrite = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if overwrite != 'y':
            print("Using existing configuration.")
            if test_connection():
                print("✅ Setup complete! You can now run: python menu_scraper_simple.py")
            return
    
    # Setup configuration
    if setup_database():
        print("\nTesting connection...")
        if test_connection():
            print("✅ Setup complete! You can now run: python menu_scraper_simple.py")
        else:
            print("❌ Setup failed. Please check your database credentials.")
    else:
        print("❌ Setup failed.")

if __name__ == "__main__":
    main()
