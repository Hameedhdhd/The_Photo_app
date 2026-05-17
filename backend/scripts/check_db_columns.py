import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load updated env from frontend
load_dotenv('backend/.env')

url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
key = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")

print(f"Connecting to {url}...")

try:
    supabase: Client = create_client(url, key)
    # Fetch all columns for the 'items' table by selecting one row
    response = supabase.table('items').select('*').limit(1).execute()
    print("Connection successful!")
    if response.data:
        print("\nExisting columns in 'items' table:")
        for col in response.data[0].keys():
            print(f" - {col}")
    else:
        print("\nTable 'items' is empty, but connection worked.")
except Exception as e:
    print(f"Error: {e}")
