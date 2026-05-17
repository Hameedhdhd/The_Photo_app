import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('C:\\AI Projects\\The_Photo_app\\backend\\.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials")
    exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get one row to see the column names
try:
    result = client.table('german_addresses').select('*').limit(1).execute()
    if result.data and len(result.data) > 0:
        row = result.data[0]
        print("Column names in german_addresses table:")
        print("=" * 50)
        for col_name in row.keys():
            print(f"  - {col_name}")
        print("=" * 50)
        print("\nExample row:")
        for col_name, value in row.items():
            print(f"  {col_name}: {value}")
    else:
        print("No data in german_addresses table")
except Exception as e:
    print(f"Error: {e}")
