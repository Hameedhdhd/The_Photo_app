import psycopg2
import sys

# Database connection
DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

def rename_table():
    print(f"Connecting to database to rename 'APP_Table' to 'items'...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if items already exists
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'items');")
        items_exists = cursor.fetchone()[0]
        
        # Check if APP_Table exists
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'APP_Table');")
        app_table_exists = cursor.fetchone()[0]
        
        if items_exists:
            print("Table 'items' already exists.")
        elif app_table_exists:
            print("Renaming table 'APP_Table' to 'items'...")
            cursor.execute("ALTER TABLE \"APP_Table\" RENAME TO \"items\";")
            print("Table renamed successfully!")
        else:
            print("Neither 'APP_Table' nor 'items' exists. Please check your database.")
            return

        # Grant access to items
        print("Granting permissions on 'items' table...")
        cursor.execute("GRANT ALL ON TABLE \"items\" TO anon, authenticated, service_role;")
        cursor.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;")
        
        # Ensure RLS is enabled (if desired, but migration.sql will handle policies)
        cursor.execute("ALTER TABLE \"items\" ENABLE ROW LEVEL SECURITY;")
        
        # Recreate the API view if it exists
        print("Recreating API view for 'items'...")
        cursor.execute("DROP VIEW IF EXISTS api.items CASCADE;")
        cursor.execute("CREATE VIEW api.items WITH (security_invoker=on) AS SELECT * FROM public.items;")
        cursor.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON api.items TO anon, authenticated;")
        
        print("Table 'items' is ready!")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    rename_table()
