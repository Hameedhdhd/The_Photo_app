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

print(f"Checking for ANY columns in {url}...")

try:
    # Get just one row and look at the keys
    resp = requests.get(f"{url}/rest/v1/items?select=*&limit=1", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        if data:
            print("\nActual Columns in the database right now:")
            for col in data[0].keys():
                print(f" - {col}")
        else:
            print("Table is empty, trying error probe...")
            # Try a select that should fail to see available columns
            resp2 = requests.get(f"{url}/rest/v1/items?select=not_real", headers=headers)
            print(f"Probe Response: {resp2.text}")
    else:
        print(f"Error: {resp.status_code} - {resp.text}")

except Exception as e:
    print(f"Error: {e}")
