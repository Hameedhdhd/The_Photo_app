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

print(f"Connecting to {url}...")

# Force an error by selecting a non-existent column to see if the error message 
# reveals available columns, or try to select everything.
rest_url = f"{url}/rest/v1/items?select=*"
try:
    response = requests.get(rest_url, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if data:
            print("Columns found in existing data:")
            for col in data[0].keys():
                print(f" - {col}")
        else:
            print("Table exists but is empty.")
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
