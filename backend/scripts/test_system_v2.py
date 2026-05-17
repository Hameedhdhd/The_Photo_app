
import psycopg2
import sys

DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

def test_database():
    print("--- Testing Database ---")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✓ Connected to database")
        
        # List all tables in public schema
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        public_tables = [t[0] for t in cursor.fetchall()]
        print(f"Current tables in public: {public_tables}")

        # Check tables
        tables = ['items', 'messages']
        for table in tables:
            cursor.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}');")
            exists = cursor.fetchone()[0]
            if exists:
                print(f"✓ Table '{table}' exists")
                # Check columns for messages
                if table == 'messages':
                    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'chat_id';")
                    col = cursor.fetchone()
                    if col:
                        print(f"  ✓ messages.chat_id type: {col[1]}")
                
                # Check columns for items
                if table == 'items':
                    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'address';")
                    if cursor.fetchone():
                        print("  ✓ items.address exists")
                    else:
                        print("  ✗ items.address MISSING")
            else:
                print(f"✗ Table '{table}' MISSING! (Did you run the migration?)")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"✗ Database error: {e}")

def test_storage():
    print("\n--- Testing Storage ---")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, public FROM storage.buckets WHERE id IN ('item_images', 'chat_images');")
        buckets = cursor.fetchall()
        existing_buckets = [b[0] for b in buckets]
        
        for b_id in ['item_images', 'chat_images']:
            if b_id in existing_buckets:
                print(f"✓ Bucket '{b_id}' exists")
            else:
                print(f"✗ Bucket '{b_id}' MISSING!")
                
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"✗ Storage test error: {e}")

if __name__ == "__main__":
    test_database()
    test_storage()
