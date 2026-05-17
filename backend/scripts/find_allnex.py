#!/usr/bin/env python3
"""
Find and delete Allnex entry from database
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
    print("❌ Error: Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("=" * 70)
print("SEARCH FOR ALLNEX ENTRY")
print("=" * 70)

# Search for postcode 20041
print("\n🔍 Searching for postcode 20041...")
response = supabase.table("german_addresses").select("*").eq("postcode", "20041").execute()
records = response.data

if records:
    print(f"✅ Found {len(records)} record(s):")
    for record in records:
        print(f"   ID: {record['id']}")
        print(f"   City: {record['city']}")
        print(f"   Postcode: {record['postcode']}")
        print(f"   State: {record.get('state', 'N/A')}")
        print()
else:
    print("❌ No records found for 20041")

# Search for "Allnex" in city name
print("\n🔍 Searching for 'Allnex' in city names...")
response = supabase.table("german_addresses").select("*").ilike("city", "%Allnex%").execute()
records = response.data

if records:
    print(f"✅ Found {len(records)} record(s) with 'Allnex':")
    for record in records:
        print(f"   ID: {record['id']}")
        print(f"   City: {record['city']}")
        print(f"   Postcode: {record['postcode']}")
        print(f"   State: {record.get('state', 'N/A')}")
        print()
        
        # Delete this record
        print(f"   🗑️ Deleting ID {record['id']}...")
        try:
            supabase.table("german_addresses").delete().eq("id", record['id']).execute()
            print(f"   ✅ Deleted!")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
else:
    print("❌ No records found with 'Allnex'")

# Search for "Hinschenfelde" 
print("\n🔍 Searching for 'Hinschenfelde'...")
response = supabase.table("german_addresses").select("*").ilike("city", "%Hinschenfelde%").execute()
records = response.data

if records:
    print(f"✅ Found {len(records)} record(s) with 'Hinschenfelde':")
    for record in records:
        print(f"   ID: {record['id']}")
        print(f"   City: {record['city']}")
        print(f"   Postcode: {record['postcode']}")
        print(f"   State: {record.get('state', 'N/A')}")
        print()
        
        # Delete this record
        print(f"   🗑️ Deleting ID {record['id']}...")
        try:
            supabase.table("german_addresses").delete().eq("id", record['id']).execute()
            print(f"   ✅ Deleted!")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
else:
    print("❌ No records found with 'Hinschenfelde'")

print("\n" + "=" * 70)
print("SEARCH COMPLETE")
print("=" * 70)
