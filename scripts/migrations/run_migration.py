#!/usr/bin/env python3
"""
Run Supabase Migration
Executes the marketplace_migration.sql file directly on your Supabase database
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env")
    sys.exit(1)

# Read the migration file
try:
    with open('supabase/marketplace_migration.sql', 'r') as f:
        migration_sql = f.read()
    print("✅ Migration SQL file loaded")
except FileNotFoundError:
    print("❌ ERROR: supabase/marketplace_migration.sql not found")
    sys.exit(1)

# Import psycopg2 for direct database connection
try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("⚠️  Installing psycopg2...")
    os.system('pip install psycopg2-binary')
    import psycopg2
    from psycopg2 import sql

try:
    
    print("\n" + "="*60)
    print("EXECUTING MIGRATION")
    print("="*60)
    
    # Extract database connection parameters from Supabase URL
    # Format: https://projectid.supabase.co
    import re
    match = re.match(r'https://([^.]+)\.supabase\.co', SUPABASE_URL)
    if not match:
        print("❌ ERROR: Invalid Supabase URL format")
        sys.exit(1)
    
    project_id = match.group(1)
    
    # Connect to Supabase PostgreSQL
    conn = psycopg2.connect(
        host=f"{project_id}.supabase.co",
        port=5432,
        user="postgres",
        password=SUPABASE_SERVICE_ROLE_KEY,
        database="postgres",
        sslmode="require"
    )
    
    cursor = conn.cursor()
    
    print(f"✅ Connected to Supabase ({project_id})")
    print(f"Executing {len(migration_sql)} characters of SQL...\n")
    
    # Execute the migration
    cursor.execute(migration_sql)
    conn.commit()
    
    print("\n" + "="*60)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("\nNext steps:")
    print("1. Refresh your Expo app (Cmd+R or Ctrl+R)")
    print("2. Click 'Demo Login' button on LoginScreen")
    print("3. Try adding an item")
    
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"\n❌ DATABASE ERROR: {e}")
    print(f"Error Code: {e.pgcode}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    sys.exit(1)
