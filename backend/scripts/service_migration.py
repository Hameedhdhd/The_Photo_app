import os
import requests
from dotenv import load_dotenv

# Load root .env for service key
load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not service_key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in root .env")
    exit(1)

print(f"Attempting to add columns to {url} using SERVICE_ROLE_KEY...")

# Supabase has a SQL execution endpoint, but it's usually restricted to dashboard.
# However, we can try to use a dummy insert with service key.
# Actually, the service key bypasses RLS, but it still can't ALTER TABLE via REST.

# The ONLY way to run ALTER TABLE via API is if there is an 'exec_sql' RPC function 
# defined in the database. 

sql = """
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS street_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS country TEXT;
"""

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json"
}

# Try to call a potential 'exec_sql' RPC
rpc_url = f"{url}/rest/v1/rpc/exec_sql"
try:
    print("Trying to execute SQL via RPC...")
    response = requests.post(rpc_url, headers=headers, json={"sql_query": sql})
    if response.status_code == 200:
        print(" ✅ SUCCESS: Columns added via RPC!")
    else:
        print(f" ❌ FAILED: RPC method not found or restricted ({response.status_code})")
        print("Note: Most Supabase projects don't have this RPC by default for security.")
except Exception as e:
    print(f"Error: {e}")
