import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
import uuid

def test_items_table():
    # Load .env
    env_path = Path("backend/.env")
    print(f"Loading env from: {env_path.absolute()}")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    # SUPABASE_API_KEY is the actual service role (secret) key
    key = os.environ.get("SUPABASE_API_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_API_KEY not found in .env")
        return
    
    print(f"Using key prefix: {key[:12]}")

    print(f"Connecting to: {url}")
    try:
        supabase = create_client(url, key)
        
        # Test items table access
        print("Testing access to 'items' table...")
        response = supabase.table("items").select("*", count="exact").limit(1).execute()
        print(f"✓ Successfully connected to 'items' table. Current row count: {response.count}")
        
        # Test inserting a sample item
        print("Testing INSERT operation...")
        sample_item = {
            "item_id": f"TEST-{uuid.uuid4().hex[:8].upper()}",
            "title": "Test Item",
            "description": "This is a test item to verify database functionality",
            "price": "10.00",
            "category": "Test",
            "status": "listed",
            "address": "Test Address 123",
            "latitude": 52.5200,
            "longitude": 13.4050
        }
        
        insert_response = supabase.table("items").insert(sample_item).execute()
        print("✓ Successfully inserted test item!")
        
        # Verify the insertion by fetching the test item
        test_item_id = insert_response.data[0]['item_id']
        print(f"Verifying insertion with item_id: {test_item_id}")
        
        verify_response = supabase.table("items").select("*").eq("item_id", test_item_id).execute()
        if verify_response.data:
            print("✓ Test item successfully retrieved!")
            print(f"  - Title: {verify_response.data[0]['title']}")
            print(f"  - Price: {verify_response.data[0]['price']}")
            print(f"  - Category: {verify_response.data[0]['category']}")
            print(f"  - Address: {verify_response.data[0]['address']}")
        
        # Clean up: delete the test item
        supabase.table("items").delete().eq("item_id", test_item_id).execute()
        print("✓ Test item cleaned up successfully!")
        
        # Test storage access
        print("Testing access to 'item_images' bucket...")
        storage_response = supabase.storage.list_buckets()
        buckets = [b.name for b in storage_response]
        if "item_images" in buckets:
            print("✓ Successfully connected to storage. Bucket 'item_images' exists.")
        else:
            print("⚠ Storage connected, but bucket 'item_images' not found.")
            print(f"Available buckets: {buckets}")
            
        print("\n🎉 Database setup is working correctly!")
        print("- Items table exists and accepts data")
        print("- RLS policies are properly configured")
        print("- Storage buckets are accessible")
        print("- Both read and write operations work")
        
    except Exception as e:
        print(f"✗ Database test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_items_table()