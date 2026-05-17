#!/usr/bin/env python3
"""
Run Supabase Migration via REST API
Uses Supabase REST API to execute the migration (no port 5432 needed)
"""

import os
import sys
from dotenv import load_dotenv
import requests
import json

# Load environment variables from root .env file
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
# Try both key names - user might have SUPABASE_API_KEY or SUPABASE_SERVICE_ROLE_KEY
SUPABASE_API_KEY = os.getenv('SUPABASE_API_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_API_KEY:
    print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_API_KEY in .env")
    sys.exit(1)

print(f"✅ Using SUPABASE_API_KEY from .env")

# Read the migration file
try:
    with open('supabase/marketplace_migration.sql', 'r') as f:
        migration_sql = f.read()
    print("✅ Migration SQL file loaded")
except FileNotFoundError:
    print("❌ ERROR: supabase/marketplace_migration.sql not found")
    sys.exit(1)

print("\n" + "="*60)
print("EXECUTING MIGRATION VIA SUPABASE REST API")
print("="*60)

# Supabase REST API endpoint for executing SQL
# We'll use the rpc endpoint to call pg_execute
rest_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

headers = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}",
    "Content-Type": "application/json"
}

# Split the migration into individual statements and execute them
# This is safer than trying to execute the whole thing at once
statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]

print(f"\nFound {len(statements)} SQL statements to execute\n")

success_count = 0
error_count = 0

for i, statement in enumerate(statements, 1):
    if not statement.strip():
        continue
    
    print(f"[{i}/{len(statements)}] Executing statement...")
    
    try:
        # Use the supabase-py SDK instead
        from supabase import create_client
        
        supabase = create_client(SUPABASE_URL, SUPABASE_API_KEY)
        
        # Execute via SQL
        result = supabase.rpc('exec_sql', {'sql': statement}).execute()
        
        success_count += 1
        print(f"  ✅ Success")
        
    except Exception as e:
        # Try direct HTTP approach
        try:
            payload = {"sql": statement}
            response = requests.post(rest_url, json=payload, headers=headers, timeout=30)
            
            if response.status_code in [200, 201]:
                success_count += 1
                print(f"  ✅ Success")
            else:
                print(f"  ⚠️  Status {response.status_code}: {response.text[:100]}")
                error_count += 1
        except Exception as e2:
            print(f"  ❌ Error: {str(e2)[:80]}")
            error_count += 1

print("\n" + "="*60)
print(f"MIGRATION COMPLETED: {success_count} success, {error_count} errors")
print("="*60)

if error_count == 0:
    print("\n✅ All statements executed!")
    print("\nNext steps:")
    print("1. Refresh your Expo app (Cmd+R or Ctrl+R)")
    print("2. Click 'Demo Login' button on LoginScreen")
    print("3. Try adding an item")
else:
    print(f"\n⚠️  {error_count} statements had issues. Check Supabase dashboard.")
    print("Go to SQL Editor in Supabase dashboard and check the logs.")
