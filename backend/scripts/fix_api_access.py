"""Create api.items view to expose public.items to the REST API."""
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env
for p in [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]:
    if p.exists():
        load_dotenv(p, override=False)

token = os.environ.get('SUPABASE_ACCESS_TOKEN', '')
project = 'awwahpecfvdljgupnzft'

sql = """
-- Drop existing view
DROP VIEW IF EXISTS api.items CASCADE;

-- Create view with security_invoker so RLS policies are respected
CREATE VIEW api.items
WITH (security_invoker=on)
AS SELECT * FROM public.items;

-- Grant permissions
GRANT SELECT ON api.items TO anon;
GRANT SELECT ON api.items TO authenticated;
GRANT INSERT ON api.items TO anon;
GRANT INSERT ON api.items TO authenticated;
GRANT UPDATE ON api.items TO anon;
GRANT UPDATE ON api.items TO authenticated;
GRANT DELETE ON api.items TO anon;
GRANT DELETE ON api.items TO authenticated;
GRANT ALL ON api.items TO service_role;
GRANT ALL ON SCHEMA api TO service_role;
"""

resp = requests.post(
    f'https://api.supabase.com/v1/projects/{project}/database/query',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    json={'query': sql}
)
print(f"Create view status: {resp.status_code}")
print(f"Response: {resp.text[:500]}")

if resp.status_code in [200, 201]:
    # Test REST API
    url = os.environ.get('SUPABASE_URL', '')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    anon_key = os.environ.get('SUPABASE_ANON_KEY', '')
    
    import time
    time.sleep(2)
    
    # Test with service role key
    resp2 = requests.get(
        f'{url}/rest/v1/items?select=item_id,favorite&limit=2',
        headers={'apikey': key, 'Authorization': f'Bearer {key}'}
    )
    print(f"\nREST API (service role): {resp2.status_code}")
    print(f"Body: {resp2.text[:300]}")
    
    # Test with anon key
    if anon_key:
        resp3 = requests.get(
            f'{url}/rest/v1/items?select=item_id,favorite&limit=2',
            headers={'apikey': anon_key, 'Authorization': f'Bearer {anon_key}'}
        )
        print(f"\nREST API (anon): {resp3.status_code}")
        print(f"Body: {resp3.text[:300]}")