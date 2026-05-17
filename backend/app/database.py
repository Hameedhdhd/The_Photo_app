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
    # CRITICAL: We need the SERVICE_ROLE_KEY for backend operations
    # SUPABASE_SERVICE_ROLE_KEY should be the 'sb_secret_*' key
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_API_KEY")
    
    if not supabase_url or not supabase_key:
        print("Warning: Supabase credentials not fully provided in backend.")
        print(f"  SUPABASE_URL: {'set' if supabase_url else 'NOT SET'}")
        print(f"  SUPABASE_API_KEY: {'set' if os.environ.get('SUPABASE_API_KEY') else 'NOT SET'}")
        return None
    
    key_preview = supabase_key[:12] if supabase_key else 'none'
    print(f"Using Supabase key prefix: {key_preview}")
    return create_client(supabase_url, supabase_key)

supabase = get_supabase_client()
