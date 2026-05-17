import os
import csv
import pandas as pd
from supabase import create_client
import sys

# Add root folder to path to import dotenv
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from dotenv import load_dotenv

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "DE.txt")
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

def organize_data():
    print(f"📖 Reading {INPUT_FILE}...")
    
    # Read tab-separated file with specific columns
    # 0: country_code, 1: postal_code, 2: place_name, 3: admin_name1 (state/district)
    # 4-8: other admin fields, 9: latitude, 10: longitude, 11: accuracy
    columns = [
        "country_code", "postal_code", "city", "district", "admin_code1",
        "admin_name2", "admin_code2", "admin_name3", "admin_code3", 
        "latitude", "longitude", "accuracy"
    ]
    
    try:
        df = pd.read_csv(INPUT_FILE, sep="\t", header=None, names=columns, dtype=str)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return None
        
    print(f"📊 Found {len(df)} total rows.")
    
    # Select only the columns we need
    df_clean = df[["postal_code", "city", "district"]]
    
    # Add country column
    df_clean["country"] = "Germany"
    
    # Filter out companies (very long names, GmbH, AG, etc.)
    companies_regex = r'(?i)\b(GmbH|AG|KG|Co\.|Verein|Bank|Versicherung)\b'
    mask = ~df_clean['city'].str.contains(companies_regex, na=False)
    df_clean = df_clean[mask]
    
    print(f"🧹 Filtered down to {len(df_clean)} rows (removed companies/invalid names).")
    
    # Remove duplicates (keep first occurrence) based on postcode + city
    df_clean = df_clean.drop_duplicates(subset=["postal_code", "city"])
    
    print(f"✨ Final count: {len(df_clean)} unique locations.")
    
    # Fill NaN values with empty string or default to prevent JSON error
    df_clean = df_clean.fillna("")
    
    # Save to CSV
    df_clean.to_csv(OUTPUT_FILE, index=False)
    print(f"💾 Saved organized data to {OUTPUT_FILE}")
    
    return df_clean

def push_to_supabase(df):
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
    df = organize_data()
    if df is not None:
        # Ask for confirmation before pushing 16k rows
        confirm = input("\nDo you want to push this data to Supabase now? (y/n): ")
        if confirm.lower() == 'y':
            push_to_supabase(df)
        else:
            print("Upload skipped.")
