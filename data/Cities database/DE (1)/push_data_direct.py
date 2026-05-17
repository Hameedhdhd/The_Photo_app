import os
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from backend/.env
# Need to go up from: data/Cities database/DE (1) -> 3 levels up to project root
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend', '.env'))
print(f"Looking for .env at: {env_path}")
print(f".env exists: {os.path.exists(env_path)}")

load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY found: {bool(SUPABASE_KEY)}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n❌ ERROR: Missing Supabase credentials!")
    print("\nPlease ensure your backend/.env file contains:")
    print("  - SUPABASE_URL=https://your-project.supabase.co")
    print("  - SUPABASE_SERVICE_ROLE_KEY=your_key_here (or SUPABASE_ANON_KEY)")
    exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Read the cleaned CSV
csv_path = os.path.join(os.path.dirname(__file__), "German ZIP Codes (Postleitzahl) 2026.csv")
print(f"\nReading {csv_path}...")

try:
    df = pd.read_csv(csv_path, dtype=str)
except Exception as e:
    print(f"❌ Error reading CSV: {e}")
    exit(1)

print(f"✅ Read {len(df)} rows from CSV")
df = df.fillna("")

# Rename columns to match database schema
df = df.rename(columns={
    'Postal Code': 'postal_code',
    'City': 'city',
    'State': 'state',
    'Country': 'country'
})

print(f"\n🚀 Uploading to 'german_addresses' table...")
records = df.to_dict('records')
batch_size = 1000
total = len(records)

successful = 0
errors = 0

for i in range(0, total, batch_size):
    batch = records[i:i + batch_size]
    try:
        result = client.table('german_addresses').upsert(
            batch, 
            on_conflict='postal_code,city'
        ).execute()
        
        successful += len(batch)
        percent = min(i + batch_size, total)
        print(f"  ✅ Uploaded {percent}/{total} records ({int(percent/total*100)}%)")
    except Exception as e:
        errors += 1
        print(f"  ❌ Error on batch {i}-{min(i+batch_size, total)}: {e}")

print(f"\n🎉 Complete! {successful} records uploaded successfully")
if errors > 0:
    print(f"⚠️  {errors} batch errors occurred")
