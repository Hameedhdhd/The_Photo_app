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
    print("\nProbing for address columns...")
    
    # Try common column names to see which ones exist
    columns_to_test = ['street_name', 'postal_code', 'city', 'country', 'street', 'postcode', 'address_line_1', 'zip']
    
    for col in columns_to_test:
        try:
            supabase.table('items').select(col).limit(1).execute()
            print(f" ✅ Column '{col}' EXISTS")
        except Exception as e:
            if "does not exist" in str(e):
                print(f" ❌ Column '{col}' does NOT exist")
            else:
                print(f" ❓ Error checking '{col}': {e}")
                
except Exception as e:
    print(f"Global Error: {e}")
