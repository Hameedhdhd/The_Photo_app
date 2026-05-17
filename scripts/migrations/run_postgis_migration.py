import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Load env from multiple possible locations
env_paths = [
    Path.cwd() / "backend" / ".env",
    Path.cwd() / ".env",
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break

def run_sql():
    url = os.environ.get("SUPABASE_URL")
    # Using Service Role Key for administrative tasks
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
        return

    supabase = create_client(url, key)
    
    sql_path = Path.cwd() / "supabase" / "enable_postgis.sql"
    if not sql_path.exists():
        print(f"Error: {sql_path} not found.")
        return

    with open(sql_path, "r") as f:
        sql = f.read()

    print(f"Running migration from {sql_path}...")
    try:
        # Supabase Python SDK doesn't have a direct 'rpc' for raw SQL 
        # unless we use the Postgres connection or a custom function.
        # However, we can use the POST REST API to run SQL via the 'query' endpoint 
        # if the project supports it, or use psycopg2 for direct DB access.
        
        # Check if we have DB connection URL
        db_url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
        if db_url:
            import psycopg2
            conn = psycopg2.connect(db_url)
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute(sql)
            conn.close()
            print("✅ PostGIS migration completed successfully via psycopg2.")
        else:
            print("Error: DATABASE_URL or DIRECT_URL missing in .env.")
            print("Please run the SQL manually in the Supabase Dashboard SQL Editor:")
            print("-" * 20)
            print(sql)
            print("-" * 20)
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("Please run the SQL manually in the Supabase Dashboard SQL Editor.")

if __name__ == "__main__":
    run_sql()
