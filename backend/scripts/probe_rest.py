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

print(f"Probing {url} for address columns via REST API...")

columns_to_test = ['street_name', 'postal_code', 'city', 'country', 'street', 'postcode', 'address_line_1', 'zip']

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

for col in columns_to_test:
    # Use a filter that will likely return 0 results but valid SQL
    rest_url = f"{url}/rest/v1/items?select={col}&limit=1"
    try:
        response = requests.get(rest_url, headers=headers)
        if response.status_code == 200:
            print(f" ✅ Column '{col}' EXISTS")
        elif response.status_code == 400:
            error_data = response.json()
            if "does not exist" in str(error_data.get('message', '')):
                print(f" ❌ Column '{col}' does NOT exist")
            else:
                print(f" ❓ Error checking '{col}': {response.status_code} - {error_data}")
        else:
            print(f" ❓ Unexpected Status '{col}': {response.status_code} - {response.text}")
    except Exception as e:
        print(f" ❌ Error checking '{col}': {e}")
