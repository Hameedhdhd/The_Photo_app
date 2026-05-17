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
    # Get column names from the information_schema via RPC if possible
    # Since we can't do direct SQL easily with anon key, we'll try to list buckets/tables 
    # to prove the key is active and then just use the standard names I've prepared.
    # The error "JSON could not be generated" usually means the table doesn't exist or RLS blocks it.
    
    print("\nAttempting to fetch table definition...")
    # This is a trick to get error message that might contain column names or at least confirm table exists
    response = supabase.table('items').select('non_existent_column').execute()
except Exception as e:
    # The error message often contains the actual column names in Postgres
    print(f"Postgres Response: {e}")
