import os
import requests
import json
from dotenv import load_dotenv

# Load root .env
load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# The only other way is to use the SQL API directly if we can mimic the dashboard.
# But Supabase Dashboard uses a private API for SQL Editor.

# Let's try to do a "schema cache reload" by sending a GET request with a specific header.
# Sometimes PostgREST needs this to see new columns.

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}"
}

print(f"Attempting to reload schema cache for {url}...")

# PostgREST reload schema trick
try:
    # Most Supabase instances won't allow this via anon/service key directly without specific setup
    # but it's worth a try.
    response = requests.get(f"{url}/rest/v1/", headers=headers)
    print(f"Schema reload request sent. Status: {response.status_code}")
    
    # Check columns again
    print("\nVerifying columns one more time...")
    test_url = f"{url}/rest/v1/items?select=address&limit=1"
    check_resp = requests.get(test_url, headers=headers)
    if check_resp.status_code == 200:
        print(" ✅ FOUND IT! The 'address' column is now visible.")
    else:
        print(f" ❌ STILL NOT FOUND: {check_resp.status_code} - {check_resp.text}")

except Exception as e:
    print(f"Error: {e}")
