import os
import psycopg2
from dotenv import load_dotenv

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Supabase config
load_dotenv(os.path.join(BASE_DIR, '..', '..', 'backend', '.env'))
DB_URL = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")

if not DB_URL:
    print("❌ Missing DATABASE_URL or DIRECT_URL in .env file")
    sys.exit(1)

def create_table_via_psycopg2():
    print(f"🚀 Connecting directly to PostgreSQL via psycopg2...")
    
    sql = """
    -- Drop it first if it somehow exists but is corrupted
    DROP TABLE IF EXISTS public.german_addresses;
    
    -- Create table
    CREATE TABLE public.german_addresses (
      id BIGSERIAL PRIMARY KEY,
      postal_code VARCHAR(20) NOT NULL,
      city VARCHAR(180) NOT NULL,
      district VARCHAR(100),
      country VARCHAR(50) DEFAULT 'Germany',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(postal_code, city)
    );

    -- Create index for faster lookups
    CREATE INDEX idx_german_addresses_postal_code ON public.german_addresses(postal_code);
    CREATE INDEX idx_german_addresses_city ON public.german_addresses(city);

    -- Enable Row Level Security
    ALTER TABLE public.german_addresses ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow public read access
    CREATE POLICY "Enable read access for all users" ON public.german_addresses
        FOR SELECT
        USING (true);
    """
    
    try:
        # Extract connection details or just pass the DSN
        # PostgreSQL syntax
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Executing SQL to create the table...")
        cur.execute(sql)
        print("✅ Table 'german_addresses' created successfully!")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection or execution error: {e}")
        return False

if __name__ == "__main__":
    create_table_via_psycopg2()