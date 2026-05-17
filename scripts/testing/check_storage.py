import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_API_KEY')

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL or keys not found in backend/.env")
    exit(1)

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}"
}

print(f"\n--- Checking Storage at {supabase_url} ---\n")

# Supabase Storage endpoint
storage_url = f"{supabase_url}/storage/v1/bucket"

try:
    response = requests.get(storage_url, headers=headers)
    if response.status_code == 200:
        buckets = response.json()
        print(f"✅ Found {len(buckets)} buckets:")
        for b in buckets:
            print(f"   - {b['name']} (Public: {b['public']})")
            
            # List objects in items bucket
            if b['name'] == 'items':
                list_url = f"{supabase_url}/storage/v1/object/list/items"
                list_resp = requests.post(list_url, headers=headers, json={"prefix": "", "limit": 10})
                if list_resp.status_code == 200:
                    files = list_resp.json()
                    print(f"     Found {len(files)} files in 'items' bucket.")
                    for f in files:
                        print(f"       - {f['name']}")
    else:
        print(f"❌ Storage error: {response.status_code} {response.reason}")
except Exception as e:
    print(f"💥 Error checking storage: {e}")

print("\n--- End of Check ---")
