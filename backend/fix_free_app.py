import psycopg2
import sys

# Database connection
DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.awwahpecfvdljgupnzft.supabase.co:5432/postgres"

def fix_table():
    print(f"Connecting to database to fix Free_APP table...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Ensuring favorite column exists with default false...")
        cursor.execute("ALTER TABLE \"Free_APP\" ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT false;")
        
        # In case it already existed but was null, set it to false for existing rows
        cursor.execute("UPDATE \"Free_APP\" SET favorite = false WHERE favorite IS NULL;")
        
        print("Ensuring row level security and policies for Free_APP...")
        cursor.execute("ALTER TABLE \"Free_APP\" ENABLE ROW LEVEL SECURITY;")
        
        # Grant access to anon and authenticated
        cursor.execute("GRANT ALL ON TABLE \"Free_APP\" TO anon, authenticated, service_role;")
        
        # Basic policies (allowing everything for now to match current setup)
        cursor.execute("DROP POLICY IF EXISTS \"Enable all for all\" ON \"Free_APP\";")
        cursor.execute("CREATE POLICY \"Enable all for all\" ON \"Free_APP\" FOR ALL USING (true) WITH CHECK (true);")
        
        print("Table 'Free_APP' fixed and policies applied.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_table()
