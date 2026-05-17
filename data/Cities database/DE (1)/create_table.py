import os
import sys
from supabase import create_client

# Add root folder to path to import dotenv
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from dotenv import load_dotenv

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Supabase config
# Load from root backend/.env
load_dotenv(os.path.join(BASE_DIR, '..', '..', 'backend', '.env'))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env file")
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_table():
    print("🚀 Re-creating german_addresses table via RPC...")
    
    # Create the raw SQL to execute
    sql = """
    -- Create table
    CREATE TABLE IF NOT EXISTS public.german_addresses (
      id BIGSERIAL PRIMARY KEY,
      postal_code VARCHAR(10) NOT NULL,
      city VARCHAR(180) NOT NULL,
      district VARCHAR(100),
      country VARCHAR(50) DEFAULT 'Germany',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(postal_code, city)
    );

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_german_addresses_postal_code ON public.german_addresses(postal_code);
    CREATE INDEX IF NOT EXISTS idx_german_addresses_city ON public.german_addresses(city);

    -- Enable Row Level Security
    ALTER TABLE public.german_addresses ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow public read access
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.german_addresses;
    CREATE POLICY "Enable read access for all users" ON public.german_addresses
        FOR SELECT
        USING (true);
    """
    
    try:
        # We need to execute the SQL. Supabase Python client doesn't directly support 
        # arbitrary SQL execution without an RPC. 
        # But we can try to query first to see if we can trigger the error.
        
        import requests
        
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        # REST API way to check if table exists
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/german_addresses?limit=1",
            headers=headers
        )
        
        print("Table check status:", response.status_code)
        
        if response.status_code == 404:
            print("Table doesn't exist. Please run the SQL manually in Supabase SQL Editor.")
            print("\nCopy this SQL into Supabase SQL Editor:\n")
            print(sql)
            return False
        else:
            print("Table might exist but check columns.")
            print("\nCopy this SQL into Supabase SQL Editor to rebuild:\n")
            print("DROP TABLE IF EXISTS public.german_addresses;\n" + sql)
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    create_table()