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
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# The user wants me to fix the API. 
# Since I can't run SQL directly with the anon key, I will try to see if there is an RPC
# or if I can use a dummy insert to reveal ANY missing columns.

dummy_data = {
    "title": "API Fix Probe",
    "price": "0"
}

print(f"Testing basic insert to see what works...")
rest_url = f"{url}/rest/v1/items"
try:
    response = requests.post(rest_url, headers=headers, json=dummy_data)
    print(f"Insert Result: {response.status_code}")
    if response.status_code != 201 and response.status_code != 200:
        print(f"Error details: {response.text}")
    else:
        print("Basic insert worked. The project and key are valid.")
        
    # Now try to probe for ANY column by name using SELECT error
    print("\nProbing for existing columns via select error...")
    probe_url = f"{url}/rest/v1/items?select=id,title,price,description,address,category,room,images,user_id,created_at,status"
    probe_resp = requests.get(probe_url, headers=headers)
    if probe_resp.status_code == 200:
        print(" ✅ Basic marketplace columns EXIST.")
    else:
        print(f" ❌ One or more basic columns MISSING: {probe_resp.text}")

except Exception as e:
    print(f"Error: {e}")
