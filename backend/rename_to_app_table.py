import psycopg2
import sys

# Database connection
DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

def rename_table():
    print(f"Connecting to database to rename 'host' to 'APP_Table'...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if APP_Table already exists
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'APP_Table');")
        app_table_exists = cursor.fetchone()[0]
        
        if app_table_exists:
            print("Table 'APP_Table' already exists. Checking for 'host' table to migrate or drop...")
        
        # Check if host table exists
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'host');")
        host_exists = cursor.fetchone()[0]
        
        if host_exists:
            if app_table_exists:
                print("Both tables exist. Dropping 'APP_Table' to perform rename of 'host'...")
                cursor.execute("DROP TABLE \"APP_Table\" CASCADE;")
            
            print("Renaming table 'host' to 'APP_Table'...")
            cursor.execute("ALTER TABLE \"host\" RENAME TO \"APP_Table\";")
            print("Table renamed successfully!")
        else:
            if not app_table_exists:
                print("Table 'host' does not exist and 'APP_Table' doesn't exist either. Creating 'APP_Table' from scratch...")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS "APP_Table" (
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
                print("Table 'APP_Table' created.")
            else:
                print("Table 'APP_Table' already exists and 'host' table is gone. Nothing to rename.")

        print("Ensuring Row Level Security and policies for 'APP_Table'...")
        cursor.execute("ALTER TABLE \"APP_Table\" ENABLE ROW LEVEL SECURITY;")
        
        # Grant access
        cursor.execute("GRANT ALL ON TABLE \"APP_Table\" TO anon, authenticated, service_role;")
        # Handle sequence if it was created during RENAME or new CREATE
        cursor.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;")
        
        # Basic policies
        cursor.execute("DROP POLICY IF EXISTS \"Enable all for all\" ON \"APP_Table\";")
        cursor.execute("CREATE POLICY \"Enable all for all\" ON \"APP_Table\" FOR ALL USING (true) WITH CHECK (true);")
        
        print("Table 'APP_Table' is ready!")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    rename_table()
