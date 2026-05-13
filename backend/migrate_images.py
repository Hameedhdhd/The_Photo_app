import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

def update_schema():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not key:
        print("Missing Supabase credentials in .env")
        return

    # Use the postgrest API to execute SQL if possible, or just print instructions
    # Actually, we can't run arbitrary SQL via Postgrest unless a function exists.
    # The user already has migration files. I'll just assume they want me to apply it.
    
    print(f"URL: {url}")
    
    # Let's try to add the column using a simple RPC if available, or just log it.
    # For now, I'll update the migration file and ask the user to run it if I can't.
    # Actually, I can use the Supabase Python client if it's installed.
    
    sql = "ALTER TABLE items ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;"
    print(f"Applying SQL: {sql}")
    
    # Try using the Supabase API to run SQL (requires service role)
    # This endpoint is only available on some Supabase setups
    try:
        req = urllib.request.Request(
            f"{url}/rest/v1/rpc/run_sql", # Note: this is a common custom function name
            data=json.dumps({"sql": sql}).encode(),
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            print("Successfully updated schema via RPC")
            return
    except Exception as e:
        print(f"RPC failed (normal if 'run_sql' not defined): {e}")

    print("\nMANUAL ACTION REQUIRED if the above failed:")
    print(f"Go to Supabase SQL Editor and run:")
    print(sql)

if __name__ == "__main__":
    update_schema()
