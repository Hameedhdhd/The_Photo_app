"""
Run database migrations directly on Supabase PostgreSQL.
Uses direct database connection via psycopg2.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv('backend/.env')

# Get credentials - need the database connection string
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Extract project ref from URL
# URL format: https://<project-ref>.supabase.co
project_ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")

print(f"Project ref: {project_ref}")

# For direct PostgreSQL connection, we need:
# Host: db.<project-ref>.supabase.co
# Port: 5432 (or 6543 for pooler)
# Database: postgres
# User: postgres
# Password: <database-password> (NOT the service role key - this is different!)

# The database password is set when creating the project
# It's different from the anon/service_role keys

print("""
╔════════════════════════════════════════════════════════════════════╗
║  DIRECT DATABASE CONNECTION REQUIRED                               ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  To run migrations directly, I need your database password.        ║
║                                                                    ║
║  You can find it in Supabase Dashboard:                            ║
║  1. Go to Project Settings → Database                              ║
║  2. Look for "Connection string" → "URI" format                    ║
║  3. The password is in the connection string after postgres:       ║
║     postgresql://postgres:<PASSWORD>@db...                         ║
║                                                                    ║
║  OR just run the migration SQL in the Supabase SQL Editor:         ║
║  https://supabase.com/dashboard/project/{}/sql/new                ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
""".format(project_ref))

# Migration SQL that needs to be run
migration_sql = """
-- Add id column as primary key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'id') THEN
    ALTER TABLE items ADD COLUMN id BIGSERIAL PRIMARY KEY;
  END IF;
END $$;

-- Add other missing columns
ALTER TABLE items ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (development mode)
DROP POLICY IF EXISTS "Anonymous users can view all items" ON items;
DROP POLICY IF EXISTS "Anonymous users can insert items" ON items;
DROP POLICY IF EXISTS "Anonymous users can update items" ON items;
DROP POLICY IF EXISTS "Anonymous users can delete items" ON items;

CREATE POLICY "Anonymous users can view all items" ON items FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous users can insert items" ON items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anonymous users can update items" ON items FOR UPDATE TO anon USING (true);
CREATE POLICY "Anonymous users can delete items" ON items FOR DELETE TO anon USING (true);

-- Create policies for authenticated users  
DROP POLICY IF EXISTS "Users can view their own items" ON items;
DROP POLICY IF EXISTS "Users can insert their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;

CREATE POLICY "Users can view their own items" ON items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own items" ON items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON items FOR DELETE TO authenticated USING (auth.uid() = user_id);
"""

print("\n" + "="*70)
print("COPY THIS SQL AND RUN IN SUPABASE SQL EDITOR:")
print("="*70)
print(migration_sql)
print("="*70)

# Try to run using supabase-py's rpc if a sql function exists
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Check current table structure
print("\nChecking current items table...")
try:
    result = supabase.table("items").select("*").limit(1).execute()
    if result.data:
        columns = list(result.data[0].keys())
        print(f"✓ Current columns: {columns}")
        
        missing = []
        if 'id' not in columns:
            missing.append('id')
        if 'user_id' not in columns:
            missing.append('user_id')
        if 'image_url' not in columns:
            missing.append('image_url')
        if 'created_at' not in columns:
            missing.append('created_at')
        
        if missing:
            print(f"✗ Missing columns: {missing}")
        else:
            print("✓ All required columns exist!")
    else:
        print("✓ Table exists but is empty")
except Exception as e:
    print(f"✗ Error: {e}")