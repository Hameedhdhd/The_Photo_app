import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

def test_connection():
    # Load .env
    env_path = Path("backend/.env")
    print(f"Loading env from: {env_path.absolute()}")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    # Use SUPABASE_API_KEY as the service role key for testing if service role key is not working
    key = os.environ.get("SUPABASE_API_KEY") 
    
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_API_KEY not found in .env")
        return

    print(f"Connecting to: {url}")
    try:
        supabase = create_client(url, key)
        
        # Test table access
        print("Testing access to 'APP_Table'...")
        response = supabase.table("APP_Table").select("*", count="exact").limit(1).execute()
        print(f"✓ Successfully connected to 'APP_Table'. Current row count: {response.count}")
        
        print("\nConnection successful with SUPABASE_API_KEY!")
        
    except Exception as e:
        print(f"✗ Connection failed with SUPABASE_API_KEY: {e}")

if __name__ == "__main__":
    test_connection()
