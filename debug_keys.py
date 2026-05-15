import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

def debug_keys():
    env_path = Path("backend/.env")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    api_key = os.environ.get("SUPABASE_API_KEY")
    anon_key = os.environ.get("SUPABASE_ANON_KEY")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    print(f"URL: {url}")
    print(f"SUPABASE_API_KEY starts with: {api_key[:15] if api_key else 'None'}")
    print(f"SUPABASE_ANON_KEY starts with: {anon_key[:15] if anon_key else 'None'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY starts with: {service_key[:15] if service_key else 'None'}")

    # Try connecting with SUPABASE_API_KEY
    if api_key:
        print("\n--- Testing SUPABASE_API_KEY ---")
        try:
            client = create_client(url, api_key)
            client.table("APP_Table").select("*").limit(1).execute()
            print("✓ SUPABASE_API_KEY works for DB")
            buckets = client.storage.list_buckets()
            print(f"✓ SUPABASE_API_KEY can list storage. Buckets: {[b.name for b in buckets]}")
        except Exception as e:
            print(f"✗ SUPABASE_API_KEY failed: {e}")

    # Try connecting with SUPABASE_SERVICE_ROLE_KEY
    if service_key:
        print("\n--- Testing SUPABASE_SERVICE_ROLE_KEY ---")
        try:
            client = create_client(url, service_key)
            client.table("APP_Table").select("*").limit(1).execute()
            print("✓ SUPABASE_SERVICE_ROLE_KEY works for DB")
            buckets = client.storage.list_buckets()
            print(f"✓ SUPABASE_SERVICE_ROLE_KEY can list storage. Buckets: {[b.name for b in buckets]}")
        except Exception as e:
            print(f"✗ SUPABASE_SERVICE_ROLE_KEY failed: {e}")

if __name__ == "__main__":
    debug_keys()
