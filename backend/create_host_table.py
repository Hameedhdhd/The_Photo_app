import psycopg2
import sys

# Database connection
DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

def create_host_table():
    print(f"Connecting to database to create 'host' table...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Creating table 'host' with the same columns as Free_APP...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "host" (
                title character varying,
                room text,
                price character varying,
                category character varying,
                status text,
                description_en text,
                description_de text,
                item_id text,
                user_id uuid,
                image_url text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now(),
                favorite boolean DEFAULT false,
                listing_status character varying,
                listed_at timestamp with time zone,
                listing_url text,
                id BIGSERIAL PRIMARY KEY
            );
        """)
        
        print("Ensuring row level security and policies for 'host' table...")
        cursor.execute("ALTER TABLE \"host\" ENABLE ROW LEVEL SECURITY;")
        
        # Grant access to anon and authenticated
        cursor.execute("GRANT ALL ON TABLE \"host\" TO anon, authenticated, service_role;")
        cursor.execute("GRANT USAGE, SELECT ON SEQUENCE host_id_seq TO anon, authenticated, service_role;")
        
        # Basic policies
        cursor.execute("DROP POLICY IF EXISTS \"Enable all for all\" ON \"host\";")
        cursor.execute("CREATE POLICY \"Enable all for all\" ON \"host\" FOR ALL USING (true) WITH CHECK (true);")
        
        print("Table 'host' created and configured successfully!")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_host_table()
