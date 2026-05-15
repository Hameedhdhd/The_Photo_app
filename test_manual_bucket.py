import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

def test_manual_bucket():
    env_path = Path("backend/.env")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    # Trying with Anon Key first as requested by standard frontend logic
    anon_key = os.environ.get("SUPABASE_ANON_KEY")
    # Also trying with API Key
    api_key = os.environ.get("SUPABASE_API_KEY")
    
    print(f"URL: {url}")
    
    for name, key in [("Anon Key", anon_key), ("API Key", api_key)]:
        if not key: continue
        print(f"\n--- Testing with {name} ---")
        try:
            supabase = create_client(url, key)
            buckets = supabase.storage.list_buckets()
            print(f"Successfully listed buckets: {[b.name for b in buckets]}")
            
            # Try to get bucket info
            try:
                bucket = supabase.storage.get_bucket('item_images')
                print(f"Found 'item_images' bucket! Public: {bucket.public}")
            except Exception as e:
                print(f"'item_images' bucket not found via this key: {e}")
                
        except Exception as e:
            print(f"Failed to list buckets: {e}")

if __name__ == "__main__":
    test_manual_bucket()
