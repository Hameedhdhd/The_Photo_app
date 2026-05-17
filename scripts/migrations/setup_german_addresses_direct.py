#!/usr/bin/env python3
"""
Setup German Addresses Table via Direct PostgreSQL Connection
Uses DIRECT_URL from backend/.env to run DDL and insert 19,675 records
"""
import os
import re
import sys
import urllib.request
import urllib.parse
from dotenv import load_dotenv

load_dotenv('backend/.env')

# Get the direct URL - strip surrounding quotes if any
DIRECT_URL = os.getenv('DIRECT_URL', '').strip().strip('"').strip("'")
SUPABASE_URL = os.getenv('SUPABASE_URL', '')

if not DIRECT_URL:
    print("❌ ERROR: DIRECT_URL not found in backend/.env")
    print("   Add: DIRECT_URL=postgresql://postgres.PROJECT_REF:PASSWORD@host:5432/postgres")
    sys.exit(1)

# Parse the DIRECT_URL - handle brackets in password [PASSWORD]
# Format: postgresql://user:[PASSWORD]@host:port/db
url_clean = DIRECT_URL
# Remove brackets from password if present: :[password]@ -> :password@
url_clean = re.sub(r':\[([^\]]+)\]@', r':\1@', url_clean)

parsed = urllib.parse.urlparse(url_clean)
DB_HOST = parsed.hostname
DB_PORT = parsed.port or 5432
DB_USER = parsed.username
DB_PASS = urllib.parse.unquote(parsed.password) if parsed.password else ''
DB_NAME = parsed.path.lstrip('/')

print("=== German Addresses Database Setup (Direct Connection) ===")
print(f"  Host: {DB_HOST}:{DB_PORT}")
print(f"  User: {DB_USER}")
print(f"  DB:   {DB_NAME}")
print()

# Connect via psycopg2
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("❌ psycopg2 not installed. Installing...")
    os.system('pip install psycopg2-binary -q')
    import psycopg2
    import psycopg2.extras

print("1. Connecting to database...")
try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME,
        sslmode='require',
        connect_timeout=20
    )
    conn.autocommit = False
    cur = conn.cursor()
    print("   ✅ Connected!")
except Exception as e:
    print(f"   ❌ Connection failed: {e}")
    sys.exit(1)

# ─────────────────────────────────────────────
# Step 2: Create german_addresses table
# ─────────────────────────────────────────────
print("\n2. Creating german_addresses table...")
create_table_sql = """
CREATE TABLE IF NOT EXISTS public.german_addresses (
  id BIGSERIAL PRIMARY KEY,
  postal_code VARCHAR(5) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'Germany',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(postal_code, city)
);

CREATE INDEX IF NOT EXISTS idx_german_addresses_postal_code
  ON public.german_addresses(postal_code);

CREATE INDEX IF NOT EXISTS idx_german_addresses_city
  ON public.german_addresses(city);
"""
try:
    cur.execute(create_table_sql)
    conn.commit()
    print("   ✅ Table and indexes created (or already existed)")
except Exception as e:
    conn.rollback()
    print(f"   ❌ Failed to create table: {e}")
    sys.exit(1)

# ─────────────────────────────────────────────
# Step 3: Check existing rows
# ─────────────────────────────────────────────
print("\n3. Checking existing data...")
cur.execute("SELECT COUNT(*) FROM public.german_addresses;")
existing_count = cur.fetchone()[0]
print(f"   Current rows: {existing_count}")

if existing_count >= 19000:
    print("   ✅ Data already fully loaded! Skipping inserts.")
else:
    # ─────────────────────────────────────────────
    # Step 4: Fetch address data from GitHub gist
    # ─────────────────────────────────────────────
    print("\n4. Fetching German address data from GitHub gist...")
    gist_url = "https://gist.githubusercontent.com/pmdroid/6ae8286a494cafce82b6ea5f6cc2362a/raw"
    try:
        response = urllib.request.urlopen(gist_url, timeout=30)
        data = response.read().decode('utf-8')
        lines = data.strip().split('\n')
        print(f"   Downloaded {len(lines)} lines")
    except Exception as e:
        print(f"   ❌ Failed to fetch data: {e}")
        sys.exit(1)

    addresses = []
    for line in lines[1:]:  # skip header
        line = line.strip()
        if not line:
            continue
        parts = line.split(';')
        if len(parts) >= 3:
            addresses.append((
                parts[1].strip(),   # postal_code
                parts[0].strip(),   # city
                parts[2].strip(),   # state
                'Germany'           # country
            ))
    print(f"   Parsed {len(addresses)} addresses")

    # ─────────────────────────────────────────────
    # Step 5: Insert in batches
    # ─────────────────────────────────────────────
    print(f"\n5. Inserting {len(addresses)} addresses...")
    insert_sql = """
        INSERT INTO public.german_addresses (postal_code, city, state, country)
        VALUES %s
        ON CONFLICT (postal_code, city) DO NOTHING;
    """
    batch_size = 500
    inserted = 0
    errors = 0

    for i in range(0, len(addresses), batch_size):
        batch = addresses[i:i+batch_size]
        try:
            psycopg2.extras.execute_values(cur, insert_sql, batch, page_size=batch_size)
            conn.commit()
            inserted += len(batch)
            pct = int((inserted / len(addresses)) * 100)
            print(f"   Progress: {inserted}/{len(addresses)} ({pct}%)", end='\r')
        except Exception as e:
            conn.rollback()
            errors += 1
            if errors <= 3:
                print(f"\n   ⚠️  Batch error at {i}: {str(e)[:80]}")

    print(f"\n   ✅ Insert complete: {inserted} records, {errors} errors")

# ─────────────────────────────────────────────
# Step 6: Apply RLS policies
# ─────────────────────────────────────────────
print("\n6. Applying RLS policies for german_addresses...")
rls_sql = """
-- Enable RLS
ALTER TABLE public.german_addresses ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to SELECT (read-only lookup table)
DROP POLICY IF EXISTS "Allow public read german_addresses" ON public.german_addresses;
CREATE POLICY "Allow public read german_addresses"
  ON public.german_addresses
  FOR SELECT
  USING (true);
"""
try:
    cur.execute(rls_sql)
    conn.commit()
    print("   ✅ RLS enabled — public read access granted")
except Exception as e:
    conn.rollback()
    print(f"   ⚠️  RLS warning (may already exist): {str(e)[:80]}")

# ─────────────────────────────────────────────
# Step 7: Grant PostgREST access so frontend can query via supabase-js
# ─────────────────────────────────────────────
print("\n7. Granting PostgREST access (anon + authenticated roles)...")
grant_sql = """
GRANT SELECT ON public.german_addresses TO anon;
GRANT SELECT ON public.german_addresses TO authenticated;
"""
try:
    cur.execute(grant_sql)
    conn.commit()
    print("   ✅ Grants applied")
except Exception as e:
    conn.rollback()
    print(f"   ⚠️  Grant warning: {str(e)[:80]}")

# ─────────────────────────────────────────────
# Step 8: Verify final count + test lookups
# ─────────────────────────────────────────────
print("\n8. Verifying...")
cur.execute("SELECT COUNT(*) FROM public.german_addresses;")
final_count = cur.fetchone()[0]
print(f"   ✅ Total rows: {final_count}")

cur.execute("SELECT postal_code, city, state FROM public.german_addresses WHERE postal_code = '10115' LIMIT 1;")
row = cur.fetchone()
if row:
    print(f"   ✅ Lookup 10115: {row[1]}, {row[2]}")

cur.execute("SELECT postal_code, city FROM public.german_addresses WHERE city ILIKE 'Berlin%' LIMIT 3;")
rows = cur.fetchall()
if rows:
    print(f"   ✅ Search 'Berlin%': {', '.join(r[1] for r in rows)}")

cur.close()
conn.close()
print("\n✅ Done! german_addresses table is ready for the app.")
print(f"   {final_count} German postal codes loaded and accessible via supabase-js")
