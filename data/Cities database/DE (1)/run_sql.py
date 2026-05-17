import os
import sys
import requests
from dotenv import load_dotenv

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Supabase config
load_dotenv(os.path.join(BASE_DIR, '..', '..', 'backend', '.env'))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env file")
    sys.exit(1)

def run_sql():
    print("🚀 Trying to execute SQL directly via Supabase REST API (pg_graphql)...")
    
    # GraphQL endpoint might allow us to run raw SQL or mutations
    # But usually, it's safer to use PostgREST
    
    # Since we can't run raw SQL easily via the standard REST API,
    # let's try to create the table by making a POST request with the schema 
    # This only works if pg_meta is enabled, which it often isn't for security
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    sql = """
    CREATE TABLE IF NOT EXISTS public.german_addresses (
      id BIGSERIAL PRIMARY KEY,
      postal_code VARCHAR(10) NOT NULL,
      city VARCHAR(180) NOT NULL,
      district VARCHAR(100),
      country VARCHAR(50) DEFAULT 'Germany',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(postal_code, city)
    );
    CREATE INDEX IF NOT EXISTS idx_german_addresses_postal_code ON public.german_addresses(postal_code);
    CREATE INDEX IF NOT EXISTS idx_german_addresses_city ON public.german_addresses(city);
    ALTER TABLE public.german_addresses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Enable read access for all users" ON public.german_addresses FOR SELECT USING (true);
    """
    
    try:
        print("I'm going to try using a Postgres function if one exists, otherwise I'll need to ask you to use the Supabase Dashboard.")
        
        # Check if the table exists first
        res = requests.get(f"{SUPABASE_URL}/rest/v1/german_addresses?limit=1", headers=headers)
        if res.status_code == 200:
            print("✅ Table 'german_addresses' already exists!")
            return True
            
        print("❌ I cannot create tables automatically through the API due to Supabase security restrictions.")
        print("Only the database owner can create tables via the Supabase Dashboard.")
        return False
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    run_sql()