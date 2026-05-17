#!/usr/bin/env python3
import os
import sys
from supabase import create_client

# Load environment variables
os.chdir('c:/AI Projects/The_Photo_app')
sys.path.insert(0, 'c:/AI Projects/The_Photo_app')

from dotenv import load_dotenv
load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')

print(f"Connecting to: {url}")

client = create_client(url, key)

# Get table info
try:
    response = client.from_('german_addresses').select('*').limit(1).execute()
    if response.data:
        print('\nColumns in german_addresses table:')
        for col in response.data[0].keys():
            print(f'  - {col}')
        print(f'\nSample data:')
        print(response.data[0])
    else:
        print('No data found or table does not exist')
except Exception as e:
    print(f'Error: {e}')
