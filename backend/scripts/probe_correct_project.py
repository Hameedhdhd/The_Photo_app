import os
import requests
from dotenv import load_dotenv

# Load updated env from frontend
load_dotenv('backend/.env')

url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
key = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

print(f"Probing columns for the CORRECT project: {url}")

test_cols = [
    'id', 'item_id', 'title', 'price', 'description', 'address', 
    'category', 'room', 'images', 'image_url', 'user_id', 'status'
]

existing = []
missing = []

for col in test_cols:
    rest_url = f"{url}/rest/v1/items?select={col}&limit=1"
    resp = requests.get(rest_url, headers=headers)
    if resp.status_code == 200:
        existing.append(col)
    else:
        missing.append(col)

print("\nExisting Columns:")
for col in existing:
    print(f" ✅ {col}")

print("\nMissing Columns:")
for col in missing:
    print(f" ❌ {col}")
