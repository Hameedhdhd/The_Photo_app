import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Warning: Supabase credentials not fully provided in backend.")
        return None
        
    return create_client(supabase_url, supabase_key)

supabase = get_supabase_client()
