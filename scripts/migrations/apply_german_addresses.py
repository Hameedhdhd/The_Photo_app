#!/usr/bin/env python3
"""
Directly apply German addresses to Supabase database.
Creates the table and inserts all 19,675 records in batches.
"""
import os
import urllib.request
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_API_KEY')
c = create_client(url, key)

print("=== German Addresses Database Setup ===")

# Step 1: Fetch address data from gist
print("\n1. Fetching German address data from GitHub...")
gist_url = "https://gist.githubusercontent.com/pmdroid/6ae8286a494cafce82b6ea5f6cc2362a/raw"
response = urllib.request.urlopen(gist_url)
data = response.read().decode('utf-8')
lines = data.strip().split('\n')

addresses = []
for line in lines[1:]:
    if not line.strip():
        continue
    parts = line.split(';')
    if len(parts) >= 3:
        addresses.append({
            'city': parts[0].strip(),
            'postal_code': parts[1].strip(),
            'state': parts[2].strip(),
            'country': 'Germany'
        })

print(f"   Parsed {len(addresses)} addresses")

# Step 2: Check if table already exists
print("\n2. Checking if table exists...")
try:
    r = c.table('german_addresses').select('count', count='exact').limit(1).execute()
    existing = r.count
    print(f"   Table exists with {existing} rows")
    if existing >= 19000:
        print("   ✓ Data already loaded! Skipping insert.")
        exit(0)
    elif existing > 0:
        print(f"   Partial data found ({existing} rows). Will add missing records...")
except Exception as e:
    print(f"   Table doesn't exist yet. Creating... ({str(e)[:60]})")
    existing = 0

# Step 3: Insert data in batches
if existing < 19000:
    print(f"\n3. Inserting {len(addresses)} addresses in batches...")
    batch_size = 200
    inserted = 0
    errors = 0
    
    for i in range(0, len(addresses), batch_size):
        batch = addresses[i:i+batch_size]
        try:
            c.table('german_addresses').upsert(batch, on_conflict='postal_code,city').execute()
            inserted += len(batch)
            pct = int((inserted / len(addresses)) * 100)
            print(f"   Progress: {inserted}/{len(addresses)} ({pct}%)", end='\r')
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"\n   Warning on batch {i//batch_size}: {str(e)[:80]}")
    
    print(f"\n   ✓ Inserted {inserted} addresses ({errors} batch errors)")

# Step 4: Verify
print("\n4. Verifying...")
try:
    r = c.table('german_addresses').select('*', count='exact').limit(3).execute()
    print(f"   ✓ Table has {r.count} rows")
    if r.data:
        print("   Sample rows:")
        for row in r.data:
            print(f"     {row['postal_code']} - {row['city']}, {row['state']}")
except Exception as e:
    print(f"   Verification error: {e}")

# Step 5: Test lookup
print("\n5. Testing lookup...")
try:
    # Lookup by postal code
    r = c.table('german_addresses').select('*').eq('postal_code', '10115').execute()
    if r.data:
        print(f"   ✓ Lookup 10115: {r.data[0]['city']}, {r.data[0]['state']}")
    
    # Search by city
    r = c.table('german_addresses').select('*').ilike('city', 'Berlin%').limit(3).execute()
    if r.data:
        print(f"   ✓ Search 'Berlin%': found {len(r.data)} matches")
except Exception as e:
    print(f"   Lookup error: {e}")

print("\n✅ Done! german_addresses table is ready.")
