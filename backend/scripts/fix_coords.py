import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import requests

load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent / ".env")

def geocode(address):
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1"
        headers = {'User-Agent': 'ThePhotoApp/1.0'}
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"Geocoding error for {address}: {e}")
    return None, None

def fix_coords():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)
    
    print("--- Fixing Item Coordinates ---")
    response = supabase.table("items").select("*").is_("latitude", "null").execute()
    items = response.data
    
    if not items:
        print("No items need fixing.")
        return
        
    for item in items:
        address = item.get('address')
        if address and len(address) > 5:
            print(f"Geocoding: {address}...")
            lat, lng = geocode(address)
            if lat and lng:
                print(f"✅ Found: {lat}, {lng}")
                supabase.table("items").update({
                    "latitude": lat,
                    "longitude": lng
                }).eq('id', item['id']).execute()
            else:
                print("❌ Not found")
        else:
            # Fallback for testing: if no address, put it in Hamburg center
            print(f"No valid address for {item.get('title')}, using fallback Hamburg coords...")
            supabase.table("items").update({
                "latitude": 53.5511,
                "longitude": 9.9937
            }).eq('id', item['id']).execute()

if __name__ == "__main__":
    fix_coords()
