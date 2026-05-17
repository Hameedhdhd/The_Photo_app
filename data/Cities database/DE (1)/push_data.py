import os
import pandas as pd
from supabase import create_client
import sys

# Add root folder to path to import dotenv
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from dotenv import load_dotenv

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(BASE_DIR, "DE_organized.csv")

# Supabase config
# Load from root backend/.env
load_dotenv(os.path.join(BASE_DIR, '..', '..', 'backend', '.env'))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env file")
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

def push_only():
    print(f"📖 Reading {OUTPUT_FILE}...")
    
    try:
        df = pd.read_csv(OUTPUT_FILE, dtype=str)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return
        
    print(f"📊 Found {len(df)} total rows to upload.")
    
    # Fill NaN values with empty string or default to prevent JSON error
    df = df.fillna("")
    
    print("\n🚀 Pushing to Supabase 'german_addresses' table...")
    
    # Convert dataframe to list of dictionaries
    records = df.to_dict('records')
    
    # Batch upload (1000 at a time)
    batch_size = 1000
    total = len(records)
    
    successful = 0
    errors = 0
    
    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        
        try:
            # Using upsert to avoid duplicate key errors on (postal_code, city)
            result = client.table('german_addresses').upsert(
                batch, 
                on_conflict='postal_code,city'
            ).execute()
            
            successful += len(batch)
            print(f"  ✅ Inserted/Updated {min(i + batch_size, total)} / {total} records")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error on batch {i}-{i+batch_size}: {e}")
    
    print(f"\n🎉 Done! Successfully pushed {successful} records. ({errors} batch errors)")

if __name__ == "__main__":
    push_only()