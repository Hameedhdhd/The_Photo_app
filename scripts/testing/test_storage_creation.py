import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

def test_storage_creation():
    # Load .env
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
        
        # Try to create bucket via SDK
        print("Attempting to create 'item_images' bucket via SDK...")
        try:
            res = supabase.storage.create_bucket('item_images', options={'public': True})
            print(f"✓ Bucket creation response: {res}")
        except Exception as e:
            print(f"⚠ Bucket might already exist or creation failed: {e}")
            
        # List buckets
        print("Listing buckets...")
        buckets = supabase.storage.list_buckets()
        print(f"Available buckets: {[b.name for b in buckets]}")
        
    except Exception as e:
        print(f"✗ Storage test failed: {e}")

if __name__ == "__main__":
    test_storage_creation()
