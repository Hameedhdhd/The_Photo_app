import sys
import os
import csv
from pathlib import Path

# Add backend to path so we can import app
sys.path.append(str(Path(__file__).parent.parent.parent / "backend"))

try:
    from app.database import supabase
except ImportError as e:
    print(f"Error importing supabase: {e}")
    sys.exit(1)

if not supabase:
    print("Supabase client not initialized. Check credentials.")
    sys.exit(1)

def push_categories():
    csv_path = Path(__file__).parent.parent.parent / "data" / "categories" / "marketplace_categories.csv"
    
    if not csv_path.exists():
        print(f"CSV not found at {csv_path}")
        return

    print(f"Reading categories from {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data = {
                "id": int(row['id']),
                "slug": row['slug'],
                "label": row['label'],
                "label_de": row['label_de'],
                "icon": row['icon'],
                "parent_id": int(row['parent_id']) if row['parent_id'] else None,
                "sort_order": int(row['sort_order']),
                "is_active": True
            }
            
            print(f"Upserting category: {data['label']} ({data['slug']})")
            try:
                # Using upsert to handle existing IDs
                result = supabase.table("categories").upsert(data, on_conflict="id").execute()
                if hasattr(result, 'error') and result.error:
                    print(f"  Error upserting {data['label']}: {result.error}")
                else:
                    print(f"  Successfully upserted {data['label']}")
            except Exception as e:
                print(f"  Exception upserting {data['label']}: {e}")
                print("  (Note: Make sure the 'categories' table exists in Supabase)")

if __name__ == "__main__":
    push_categories()
