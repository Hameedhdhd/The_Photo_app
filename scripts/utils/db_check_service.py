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

# Tables to check
tables = ['items', 'APP_Table', 'profiles']

print(f"\n--- Checking Database at {supabase_url} ---\n")

for t in tables:
    url = f"{supabase_url}/rest/v1/{t}?select=*"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Table '{t}' found: {len(data)} rows")
            if data:
                print(f"   Latest items:")
                for i, item in enumerate(data[:5], 1):
                    name = item.get('title', item.get('name', 'Unnamed'))
                    print(f"   {i}. {name} (ID: {item.get('id', item.get('item_id', 'N/A'))})")
        else:
            print(f"❌ Table '{t}' error: {response.status_code} {response.reason}")
    except Exception as e:
        print(f"💥 Error checking '{t}': {e}")

print("\n--- End of Check ---")
