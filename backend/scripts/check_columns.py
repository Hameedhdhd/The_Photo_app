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

try:
    # Try to fetch one row to see column names
    response = supabase.table('items').select('*').limit(1).execute()
    if response.data:
        print("Existing columns in 'items' table:")
        for col in response.data[0].keys():
            print(f" - {col}")
    else:
        print("Table 'items' is empty. Cannot determine columns via select.")
except Exception as e:
    print(f"Error: {e}")
