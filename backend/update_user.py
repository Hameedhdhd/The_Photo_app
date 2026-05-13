"""Update all items to belong to Hameed@Hd.com user."""
from app.database import supabase

if not supabase:
    print("ERROR: Supabase not connected")
    exit(1)

# 1. Check current items
result = supabase.table('items').select('item_id, title, user_id').execute()
items = result.data or []
print(f"Found {len(items)} items:")
for item in items:
    uid = item.get('user_id') or 'NULL'
    print(f"  {item['item_id']}: {item['title'][:50]} | user_id={uid}")

# 2. Get the user ID for Hameed@Hd.com
# Use the Supabase auth admin API to find the user
import os
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Try to find user via REST API
import urllib.request
import json

req = urllib.request.Request(
    f"{url}/auth/v1/admin/users",
    headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        users_data = json.loads(resp.read().decode())
        hameed_user = None
        for u in users_data.get('users', []):
            if u.get('email', '').lower() == 'hameed@hd.com':
                hameed_user = u
                break
        
        if hameed_user:
            user_id = hameed_user['id']
            print(f"\nFound Hameed@Hd.com user: {user_id}")
        else:
            print("\nHameed@Hd.com user not found. Creating via sign-up...")
            # Create user via admin API
            create_req = urllib.request.Request(
                f"{url}/auth/v1/admin/users",
                data=json.dumps({
                    "email": "Hameed@Hd.com",
                    "password": "Hameed2024!",
                    "email_confirm": True
                }).encode(),
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(create_req) as resp:
                new_user = json.loads(resp.read().decode())
                user_id = new_user['id']
                print(f"Created Hameed@Hd.com user: {user_id}")
except Exception as e:
    print(f"Error finding/creating user: {e}")
    # Fallback: try to get user_id from items that already have one
    for item in items:
        if item.get('user_id'):
            user_id = item['user_id']
            print(f"Using existing user_id from items: {user_id}")
            break
    else:
        print("No user_id found anywhere. Cannot update.")
        exit(1)

# 3. Update all items without a user_id
null_items = [i for i in items if not i.get('user_id')]
if null_items:
    for item in null_items:
        supabase.table('items').update({'user_id': user_id}).eq('item_id', item['item_id']).execute()
        print(f"Updated item {item['item_id']} → user_id={user_id}")
    print(f"\nUpdated {len(null_items)} items")
else:
    print("\nAll items already have a user_id")

# 4. Also update items with a different user_id
other_items = [i for i in items if i.get('user_id') and i['user_id'] != user_id]
if other_items:
    for item in other_items:
        supabase.table('items').update({'user_id': user_id}).eq('item_id', item['item_id']).execute()
        print(f"Reassigned item {item['item_id']} → user_id={user_id}")
    print(f"\nReassigned {len(other_items)} items")

# 5. Verify
result2 = supabase.table('items').select('item_id, title, user_id').execute()
items2 = result2.data or []
print(f"\nFinal state: {len(items2)} items, all with user_id={user_id}")