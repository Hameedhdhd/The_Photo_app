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

print(f"Probing {url} for ANY existing columns in 'items' table via REST API...")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

# Select everything to see what we get
rest_url = f"{url}/rest/v1/items?select=*&limit=1"
try:
    response = requests.get(rest_url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data:
            print("Existing columns in 'items' table:")
            for col in data[0].keys():
                print(f" - {col}")
        else:
            print("Table 'items' is empty.")
    else:
        print(f"Error: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Error: {e}")
