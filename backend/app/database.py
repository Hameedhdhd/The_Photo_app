import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions

# Load .env from multiple possible locations
env_paths = [
    Path(__file__).parent.parent / ".env",  # backend/.env
    Path(__file__).parent / ".env",  # backend/app/.env
    Path.cwd() / ".env",  # current working directory
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        print(f"Loaded .env from: {env_path}")
        break

def get_supabase_client() -> Client:
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Warning: Supabase credentials not fully provided in backend.")
        print(f"  SUPABASE_URL: {'set' if supabase_url else 'NOT SET'}")
        print(f"  SUPABASE_SERVICE_ROLE_KEY: {'set' if supabase_key else 'NOT SET'}")
        return None
        
    return create_client(supabase_url, supabase_key, options=ClientOptions(schema="api"))

supabase = get_supabase_client()
