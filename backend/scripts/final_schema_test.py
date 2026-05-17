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
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# The user wants me to add them if they are not there.
# I will try to use the RPC if one exists that allows SQL, 
# but usually anon key can't do this.
# I'll try to insert a row with the columns to double check.

dummy_data = {
    "title": "Final Schema Test",
    "description": "Test",
    "address": "Test Address",
    "street_name": "Test Street",
    "city": "Test City"
}

print(f"Final attempt to verify columns via insert in {url}...")
rest_url = f"{url}/rest/v1/items"
try:
    response = requests.post(rest_url, headers=headers, json=dummy_data)
    if response.status_code == 201 or response.status_code == 200:
        print(" ✅ SUCCESS: Columns are actually there now!")
    else:
        print(f" ❌ STILL MISSING: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Error: {e}")
