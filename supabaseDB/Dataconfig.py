from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load config.env
dotenv_path = os.path.join(os.path.dirname(__file__), 'config.env')
load_dotenv(dotenv_path=dotenv_path)

# Get URL and KEY
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

# Create client
supabase: Client = create_client(url, key)

# ----------------------------
# Test 1: List all tables (Postgres catalog)
# ----------------------------
try:
    tables = supabase.table("venue").select("*").execute()
    print("Supabase connection successful!")
    print("Tables (system catalog):", tables.data)
except Exception as e:
    print("Error connecting:", e)
