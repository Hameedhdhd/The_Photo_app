import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_API_KEY')

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL or SUPABASE_API_KEY not found in backend/.env")
    exit(1)

# API endpoint for all tables
url = f"{supabase_url}/rest/v1/"

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}"
}

try:
    # Get all tables
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    tables = response.json()
    
    print("\n--- Available Tables in Database ---\n")
    for table in tables.get('definitions', {}).keys():
        print(f"- {table}")
        
    # Check specifically for APP_Table, items, etc.
    possible_tables = ['items', 'APP_Table', 'profiles']
    for t_name in possible_tables:
        t_url = f"{supabase_url}/rest/v1/{t_name}?select=count"
        t_resp = requests.get(t_url, headers=headers)
        if t_resp.ok:
            # Try to get data if count works
            d_url = f"{supabase_url}/rest/v1/{t_name}?select=*"
            d_resp = requests.get(d_url, headers=headers)
            data = d_resp.json() if d_resp.ok else []
            print(f"\nTable '{t_name}' exists and has {len(data)} rows.")
            if data:
                print(f"Sample from '{t_name}': {data[0].get('title', data[0].get('id', 'N/A'))}")
        else:
            print(f"\nTable '{t_name}' could not be accessed.")

except Exception as e:
    print(f"Error: {e}")
