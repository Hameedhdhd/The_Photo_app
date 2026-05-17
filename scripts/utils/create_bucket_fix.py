import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

def create_item_images_bucket():
    env_path = Path("backend/.env")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    # Using the working key discovered via debug_keys
    service_key = os.environ.get("SUPABASE_API_KEY")
    
    if not url or not service_key:
        print("Error: Missing URL or API Key in .env")
        return

    print(f"Connecting to: {url}")
    try:
        supabase = create_client(url, service_key)
        
        print("Attempting to create 'item_images' bucket...")
        try:
            # Create bucket via SDK
            res = supabase.storage.create_bucket('item_images', options={'public': True})
            print(f"✓ Bucket created: {res}")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("⚠ Bucket already exists.")
            else:
                print(f"✗ Failed to create bucket: {e}")
                
        # Verify
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        print(f"Current buckets: {bucket_names}")
        
        if "item_images" in bucket_names:
            print("\nSUCCESS: 'item_images' bucket is ready.")
        else:
            print("\nFAILURE: 'item_images' bucket not found.")
            
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    create_item_images_bucket()
