#!/usr/bin/env python3
"""
Run Supabase Migration - v3
Tries multiple connection methods to apply the database migration
"""
import os
import sys
import re
import requests
from dotenv import load_dotenv

# Load from unified master .env
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
# Try all possible key names
SERVICE_KEY = (
    os.getenv('SUPABASE_API_KEY') or
    os.getenv('SUPABASE_SERVICE_ROLE_KEY') or
    os.getenv('SUPABASE_SECRET_KEY') or
    os.getenv('SERVICE_ROLE_KEY')
)
ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
DB_PASSWORD = os.getenv('DB_PASSWORD') or os.getenv('DATABASE_PASSWORD')
DATABASE_URL = os.getenv('DATABASE_URL')

if not SUPABASE_URL:
    print("❌ ERROR: SUPABASE_URL not found in .env")
    sys.exit(1)

# Extract project ID
match = re.match(r'https://([^.]+)\.supabase\.co', SUPABASE_URL)
if not match:
    print(f"❌ ERROR: Invalid Supabase URL: {SUPABASE_URL}")
    sys.exit(1)
project_id = match.group(1)

print(f"✅ Project ID: {project_id}")
print(f"✅ URL: {SUPABASE_URL}")
print(f"✅ Service Key: {'Found' if SERVICE_KEY else 'NOT FOUND'}")

# Read migration file
with open('supabase/marketplace_migration_simplified.sql', 'r') as f:
    full_sql = f.read()
print(f"✅ Migration file loaded ({len(full_sql)} chars)\n")


def try_psycopg2(host, port, password):
    """Try direct PostgreSQL connection"""
    try:
        import psycopg2
        print(f"  Trying {host}:{port}...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user="postgres",
            password=password,
            database="postgres",
            sslmode="require",
            connect_timeout=10
        )
        cursor = conn.cursor()
        cursor.execute(full_sql)
        conn.commit()
        cursor.close()
        conn.close()
        return True, "Success"
    except Exception as e:
        return False, str(e)[:100]


def try_management_api(key):
    """Try Supabase Management API"""
    try:
        url = f"https://api.supabase.com/v1/projects/{project_id}/database/query"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        # Split SQL into statements
        statements = [s.strip() for s in full_sql.split(';') if s.strip() and not s.strip().startswith('--')]
        
        success_count = 0
        for i, stmt in enumerate(statements, 1):
            resp = requests.post(url, json={"query": stmt + ";"}, headers=headers, timeout=15)
            if resp.status_code in [200, 201]:
                success_count += 1
            elif resp.status_code == 401:
                return False, f"Unauthorized (401)"
            elif resp.status_code == 404:
                return False, f"Endpoint not available"
            else:
                print(f"    Statement {i}: Status {resp.status_code}")
        
        return True, f"{success_count} statements executed"
    except Exception as e:
        return False, str(e)[:100]


print(f"✅ DATABASE_URL: {'Found' if DATABASE_URL else 'NOT FOUND'}\n")

print("="*60)
print("ATTEMPTING DATABASE MIGRATION - MULTIPLE METHODS")
print("="*60)

# Method 0: Direct connection using DATABASE_URL
print("\n[Method 0] Using DATABASE_URL from .env...")
if DATABASE_URL and '[YOUR-PASSWORD]' not in DATABASE_URL:
    try:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL, sslmode='require', connect_timeout=15)
        cursor = conn.cursor()
        cursor.execute(full_sql)
        conn.commit()
        cursor.close()
        conn.close()
        print("  ✅ SUCCESS via DATABASE_URL!")
        print("\n" + "="*60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        sys.exit(0)
    except Exception as e:
        print(f"  ❌ Failed: {str(e)[:120]}")
        # Try parsing the URL manually
        try:
            import urllib.parse
            parsed = urllib.parse.urlparse(DATABASE_URL)
            host = parsed.hostname
            port = parsed.port or 5432
            user = parsed.username
            password = urllib.parse.unquote(parsed.password) if parsed.password else None
            dbname = parsed.path.lstrip('/')
            print(f"  Retrying with parsed params: {host}:{port}...")
            conn = psycopg2.connect(host=host, port=port, user=user, password=password, 
                                     database=dbname, sslmode='require', connect_timeout=15)
            cursor = conn.cursor()
            cursor.execute(full_sql)
            conn.commit()
            cursor.close()
            conn.close()
            print("  ✅ SUCCESS via parsed DATABASE_URL!")
            print("\n" + "="*60)
            print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print("="*60)
            sys.exit(0)
        except Exception as e2:
            print(f"  ❌ Also failed: {str(e2)[:120]}")
elif DATABASE_URL and '[YOUR-PASSWORD]' in DATABASE_URL:
    print("  ⚠️  DATABASE_URL contains placeholder [YOUR-PASSWORD] - replace with real password")

# Method 1: Direct PostgreSQL via pooler (port 6543)
print("\n[Method 1] Direct PostgreSQL via connection pooler (port 6543)...")
password = DB_PASSWORD or SERVICE_KEY
if password:
    ok, msg = try_psycopg2(f"aws-0-eu-central-1.pooler.supabase.com", 6543, password)
    if ok:
        print(f"  ✅ SUCCESS via pooler!")
        sys.exit(0)
    else:
        print(f"  ❌ Failed: {msg}")
else:
    print("  ⚠️  No DB password found")

# Method 2: Direct PostgreSQL on standard host (port 5432)
print("\n[Method 2] Direct PostgreSQL via project host (port 5432)...")
if password:
    ok, msg = try_psycopg2(f"{project_id}.supabase.co", 5432, password)
    if ok:
        print(f"  ✅ SUCCESS via direct connection!")
        sys.exit(0)
    else:
        print(f"  ❌ Failed: {msg}")

# Method 3: Supabase Management API
print("\n[Method 3] Supabase Management API...")
if SERVICE_KEY:
    ok, msg = try_management_api(SERVICE_KEY)
    if ok:
        print(f"  ✅ SUCCESS via Management API! ({msg})")
        sys.exit(0)
    else:
        print(f"  ❌ Failed: {msg}")

# All methods failed
print("\n" + "="*60)
print("⚠️  All automated methods failed.")
print("="*60)
print("\nYou need to add one of these to your .env file:")
print("  DB_PASSWORD=<your Supabase database password>")
print("OR apply the migration manually in the Supabase SQL Editor:")
print(f"\n  File to use: supabase/marketplace_migration_simplified.sql")
print(f"\n  Supabase Dashboard:")
print(f"  https://supabase.com/dashboard/project/{project_id}/sql/new")
