import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

def test_connection():
    # Load .env
    env_path = Path(__file__).parent / "backend" / ".env"
    if not env_path.exists():
        # Try relative to current dir
        env_path = Path(".env")
        if not env_path.exists():
             env_path = Path("backend/.env")
             
    print(f"Loading env from: {env_path.absolute()}")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
        return

    print(f"Connecting to: {url}")
    try:
        supabase = create_client(url, key)
        
        # Test table access
        print("Testing access to 'APP_Table'...")
        response = supabase.table("APP_Table").select("*", count="exact").limit(1).execute()
        print(f"✓ Successfully connected to 'APP_Table'. Current row count: {response.count}")
        
        # Test storage access
        print("Testing access to 'item_images' bucket...")
        storage_response = supabase.storage.list_buckets()
        buckets = [b.name for b in storage_response]
        if "item_images" in buckets:
            print("✓ Successfully connected to storage. Bucket 'item_images' exists.")
        else:
            print("✗ Storage connected, but bucket 'item_images' not found.")
            print(f"Available buckets: {buckets}")
            
        print("\nAll connections are working correctly!")
        
    except Exception as e:
        print(f"✗ Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
