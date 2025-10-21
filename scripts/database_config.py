"""
Database configuration for menu scraper
"""
import json
import os

class DatabaseConfig:
    """Database configuration manager"""
    
    def __init__(self, config_file: str = "db_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
    
    def load_config(self) -> dict:
        """Load configuration from file or create default"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading config: {e}")
                return self.create_default_config()
        else:
            return self.create_default_config()
    
    def create_default_config(self) -> dict:
        """Create default configuration"""
        config = {
            "mysql": {
                "host": "localhost",
                "port": 3306,
                "database": "CampusEats",
                "user": "root",
                "password": "jainam1815"
            },
            "connection_timeout": 30,
            "max_retries": 3
        }
        self.save_config(config)
        return config
    
    def save_config(self, config: dict = None):
        """Save configuration to file"""
        if config:
            self.config = config
        
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
            print(f"Configuration saved to {self.config_file}")
        except Exception as e:
            print(f"Error saving config: {e}")
    
    def get_mysql_config(self) -> dict:
        """Get MySQL configuration"""
        return self.config.get("mysql", {})
    
    def update_mysql_config(self, host: str = None, port: int = None, 
                           database: str = None, user: str = None, password: str = None):
        """Update MySQL configuration"""
        mysql_config = self.config.get("mysql", {})
        
        if host:
            mysql_config["host"] = host
        if port:
            mysql_config["port"] = port
        if database:
            mysql_config["database"] = database
        if user:
            mysql_config["user"] = user
        if password:
            mysql_config["password"] = password
        
        self.config["mysql"] = mysql_config
        self.save_config()
    
    def setup_interactive(self):
        """Interactive setup for database configuration"""
        print("Database Configuration Setup")
        print("=" * 40)
        
        current_config = self.get_mysql_config()
        
        host = input(f"MySQL host [{current_config.get('host', 'localhost')}]: ").strip()
        if not host:
            host = current_config.get('host', 'localhost')
        
        port = input(f"MySQL port [{current_config.get('port', 3306)}]: ").strip()
        if not port:
            port = current_config.get('port', 3306)
        else:
            try:
                port = int(port)
            except ValueError:
                port = 3306
        
        database = input(f"Database name [{current_config.get('database', 'menu_database')}]: ").strip()
        if not database:
            database = current_config.get('database', 'menu_database')
        
        user = input(f"Username [{current_config.get('user', 'root')}]: ").strip()
        if not user:
            user = current_config.get('user', 'root')
        
        password = input("Password: ").strip()
        
        self.update_mysql_config(host, port, database, user, password)
        print("✅ Configuration updated!")

# Example usage
if __name__ == "__main__":
    config = DatabaseConfig()
    config.setup_interactive()
