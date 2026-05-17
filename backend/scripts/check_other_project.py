import os
import requests
from dotenv import load_dotenv

# Load root .env
load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Supabase URL or Anon Key not found in root .env")
    exit(1)

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

print(f"Checking the OTHER project: {url}")

try:
    resp = requests.get(f"{url}/rest/v1/items?select=*", headers=headers)
    print(f"Status Code: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Total items found: {len(data)}")
        if data:
            for item in data[:10]:
                print(f" - [{item.get('id') or item.get('item_id')}] {item.get('title')}")
        else:
            print("Table is empty in this project too.")
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
