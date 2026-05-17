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

# API endpoint for the items table
url = f"{supabase_url}/rest/v1/items?select=*"

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    items = response.json()
    
    print(f"\n--- Backend Items List ({len(items)} items) ---\n")
    if not items:
        print("No items found in the 'items' table.")
    else:
        for i, item in enumerate(items, 1):
            title = item.get('title', 'No Title')
            price = item.get('price', 'N/A')
            category = item.get('category', item.get('room', 'N/A'))
            uid = item.get('user_id', 'Unknown')
            print(f"{i}. {title} | Price: {price} | Category: {category} | UserID: {uid}")
    print("\n--- End of List ---")

except Exception as e:
    print(f"Error fetching items: {e}")
