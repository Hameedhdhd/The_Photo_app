import os
import requests
from dotenv import load_dotenv

# Load updated env from frontend
load_dotenv('backend/.env')

url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
key = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Supabase URL or Anon Key not found in .env")
    exit(1)

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

# The user says the items are in the database.
# Let's try to fetch from 'items' but also check if there's any other table.
print(f"Deep dive into project: {url}")

try:
    print("\n1. Checking 'items' table again...")
    resp = requests.get(f"{url}/rest/v1/items?select=*", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f" - Success! Found {len(data)} items.")
        if data:
            for item in data:
                print(f"   * [{item.get('id')}] {item.get('title')} (User: {item.get('user_id')})")
    else:
        print(f" - Error fetching 'items': {resp.status_code} - {resp.text}")

    print("\n2. Checking if RLS might be blocking with an empty result...")
    # If RLS is enabled and no policy allows selection, it returns 200 with []
    # Let's check the table's total count via HEAD
    head_resp = requests.get(f"{url}/rest/v1/items", headers={**headers, "Prefer": "count=exact"})
    range_header = head_resp.headers.get('Content-Range', 'unknown')
    print(f" - Content-Range header (total count): {range_header}")

except Exception as e:
    print(f"Error: {e}")
