import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Try to load from root and backend
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent / ".env")

def check_items():
    url = os.getenv("SUPABASE_URL")
    # Use SERVICE ROLE KEY to bypass RLS for this diagnostic check
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print(f"Error: Credentials missing. URL: {url}, KEY: {'SET' if key else 'MISSING'}")
        return

    supabase = create_client(url, key)
    
    print("--- Items in Database ---")
    try:
        response = supabase.table("items").select("item_id, title, latitude, longitude, address, status").execute()
        items = response.data
        if not items:
            print("No items found.")
            return
            
        for item in items:
            lat = item.get('latitude')
            lng = item.get('longitude')
            has_coords = "✅" if lat and lng else "❌"
            print(f"ID: {item.get('item_id')} | Title: {item.get('title')} | Status: {item.get('status')} | Coords: {has_coords} ({lat}, {lng}) | Address: {item.get('address')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_items()
