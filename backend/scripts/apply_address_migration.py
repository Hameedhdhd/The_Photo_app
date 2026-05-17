import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from frontend
load_dotenv('backend/.env')

url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
key = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Supabase URL or Anon Key not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

sql = """
ALTER TABLE items ADD COLUMN IF NOT EXISTS street_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS country TEXT;
"""

print(f"Applying migration to {url}...")
try:
    # Supabase-py doesn't have a direct execute_sql method for anon key
    # We will try to do it via a RPC if available, or just tell the user to run it
    print("\nPlease run the following SQL in the Supabase Dashboard SQL Editor:")
    print("https://supabase.com/dashboard/project/" + url.split('//')[1].split('.')[0] + "/sql/new")
    print("\n" + sql)
except Exception as e:
    print(f"Error: {e}")
