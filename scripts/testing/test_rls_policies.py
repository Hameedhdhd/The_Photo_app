import os
import uuid
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_API_KEY')
anon_key = os.environ.get('SUPABASE_ANON_KEY')

# Test 1: anon key with valid UUID user_id (no auth session)
print('Test 1: anon key + valid UUID user_id (no auth session)')
try:
    c_anon = create_client(url, anon_key)
    test_uuid = str(uuid.uuid4())
    r = c_anon.table('items').insert({
        'title': 'ANON_TEST2',
        'price': '5.00',
        'category': 'Test',
        'status': 'listed',
        'user_id': test_uuid
    }).execute()
    print('  SUCCESS - anon with valid UUID works')
    c_anon.table('items').delete().eq('title', 'ANON_TEST2').execute()
except Exception as e:
    print(f'  FAILED: {str(e)[:120]}')

# Test 2: anon key with NO user_id
print()
print('Test 2: anon key + no user_id (no auth session)')
try:
    c_anon = create_client(url, anon_key)
    r = c_anon.table('items').insert({
        'title': 'ANON_TEST3',
        'price': '5.00',
        'category': 'Test',
        'status': 'listed'
    }).execute()
    print('  SUCCESS - anon without user_id works')
    c_anon.table('items').delete().eq('title', 'ANON_TEST3').execute()
except Exception as e:
    print(f'  FAILED: {str(e)[:120]}')

# Summary
print()
print('=== CONCLUSION ===')
print('The frontend needs proper Supabase Auth (email/password login).')
print('Mock login bypasses UI but leaves auth.uid() = NULL in Supabase.')
print('RLS requires auth.uid() = user_id for INSERT operations.')
print()
print('Fix: User must log in with real Supabase credentials in the app.')
print('OR: Apply a policy that allows authenticated inserts via anon key with matching user_id.')
