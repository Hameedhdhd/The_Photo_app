#!/usr/bin/env python3
"""
Database Cleanup Script: Remove Company Name Entries from german_addresses
Scans for common company suffixes and organization patterns and deletes them.
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Error: Missing Supabase credentials in environment")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Company indicators to filter (more specific patterns to avoid false positives)
COMPANY_PATTERNS = [
    " GmbH",           # German limited liability company (with space)
    " AG",             # German stock corporation (with space)
    " Ltd",            # Limited company (with space)
    " Inc",            # Incorporated (with space)
    " Corp",           # Corporation (with space)
    " Company",        # Generic company (with space)
    " Gesellschaft",   # German: Society/Company (with space)
    " KG",             # German: Partnership (with space)
    " SE",             # European company (with space)
    " plc",            # Public limited company (with space)
    " SA",             # Société Anonyme (with space)
    " SARL",           # Limited company (French) (with space)
    " & Co",           # Company indicator (with space)
    "Allnex",          # Specific company from user feedback
    "BASF",            # Chemical company (exact match likely)
    "Henkel",          # Chemical company (exact match likely)
    "Sanofi",          # Pharmaceutical
    "Roche",           # Pharmaceutical
    "Novartis",        # Pharmaceutical
    "Siemens",         # Conglomerate
    "Familienkasse",   # Government office/agency
    "Bundesamt",       # Federal office
    "Landesamt",       # State office
]

def is_company_entry(city_name):
    """Check if a city name is actually a company or office"""
    if not city_name:
        return False
    
    for pattern in COMPANY_PATTERNS:
        if pattern in city_name:
            # Special handling: "am See" (at the lake) is a legitimate city suffix
            if pattern == " SE" and "am See" in city_name:
                return False
            return True
    
    return False

def cleanup_database():
    """Scan and remove company entries from german_addresses table"""
    
    print("🔍 Scanning german_addresses table for company entries...")
    print("   (Fetching all records - this may take a moment)...")
    
    try:
        # Fetch ALL records from german_addresses (no limit)
        response = supabase.table("german_addresses").select("id, city, postcode").execute()
        records = response.data
        
        print(f"📊 Found {len(records)} total records")
        
        to_delete = []
        
        # Identify company entries
        print("\n   Identifying company entries...")
        for record in records:
            city = record.get("city", "").strip()
            
            if is_company_entry(city):
                print(f"   ❌ Company found: '{city}' (ID: {record['id']}, Postcode: {record['postcode']})")
                to_delete.append(record["id"])
        
        if not to_delete:
            print("\n✅ No company entries found! Database is clean.")
            return
        
        print(f"\n🗑️  Preparing to delete {len(to_delete)} company entries...")
        
        # Delete the identified company entries
        deleted_count = 0
        for i, record_id in enumerate(to_delete, 1):
            try:
                supabase.table("german_addresses").delete().eq("id", record_id).execute()
                deleted_count += 1
                print(f"   ✓ Deleted {i}/{len(to_delete)}")
            except Exception as e:
                print(f"   ❌ Error deleting ID {record_id}: {str(e)}")
        
        print(f"\n✅ Successfully removed {deleted_count}/{len(to_delete)} company entries from the database!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 70)
    print("DATABASE CLEANUP: Remove Company Entries")
    print("=" * 70)
    cleanup_database()
    print("=" * 70)
