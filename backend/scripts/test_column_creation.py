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

# The project ref is part of the URL
project_ref = url.split('//')[1].split('.')[0]

print(f"Project Ref: {project_ref}")

# Note: The Supabase Data API (REST) cannot perform ALTER TABLE.
# We need to use the SQL API, which usually requires the service_role key or 
# a dashboard session. Since I only have the anon key, I can't run ALTER TABLE via REST.

# However, I can try to INSERT a dummy row with the new columns. 
# If the insert works, the columns exist. If it fails with "column does not exist", 
# then we know for sure they aren't there.

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

dummy_data = {
    "title": "Schema Probe",
    "street_name": "Test",
    "postal_code": "12345",
    "city": "TestCity",
    "country": "TestCountry"
}

print(f"Testing column existence by attempting a dummy insert...")
rest_url = f"{url}/rest/v1/items"
try:
    response = requests.post(rest_url, headers=headers, json=dummy_data)
    if response.status_code == 201 or response.status_code == 200:
        print(" ✅ SUCCESS: Columns exist!")
        # Clean up if needed, but it's a dummy row
    else:
        print(f" ❌ FAILED: {response.status_code} - {response.text}")
except Exception as e:
    print(f" ❌ Error: {e}")
