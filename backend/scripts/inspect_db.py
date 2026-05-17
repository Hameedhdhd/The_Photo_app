import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Load env
load_dotenv(Path.cwd() / "backend" / ".env")
load_dotenv(Path.cwd() / ".env")

def inspect_db():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)
    
    print("--- DB Inspection ---")
    try:
        # Try to list all tables by querying a system table or just trying to select from known names
        tables = ["items", "APP_Table"]
        for table in tables:
            try:
                res = supabase.table(table).select("*").limit(1).execute()
                print(f"Table '{table}': EXISTS (Rows: {len(res.data)})")
                if res.data:
                    print(f"Columns in '{table}': {list(res.data[0].keys())}")
            except Exception as e:
                print(f"Table '{table}': DOES NOT EXIST or Error: {e}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
