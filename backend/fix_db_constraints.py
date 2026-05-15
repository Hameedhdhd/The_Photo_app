import psycopg2

DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

def fix_constraints():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Ensuring 'item_id' in 'items' table is UNIQUE...")
        # First, check if there are duplicates
        cursor.execute("SELECT item_id, COUNT(*) FROM items GROUP BY item_id HAVING COUNT(*) > 1;")
        dupes = cursor.fetchall()
        if dupes:
            print(f"Found {len(dupes)} duplicate item_ids. Cleaning up...")
            for d in dupes:
                print(f"  Removing extra copies of {d[0]}...")
                # Keep only the newest one
                cursor.execute(f"DELETE FROM items WHERE item_id = '{d[0]}' AND id NOT IN (SELECT id FROM items WHERE item_id = '{d[0]}' ORDER BY created_at DESC LIMIT 1);")

        try:
            cursor.execute("ALTER TABLE items ADD CONSTRAINT items_item_id_key UNIQUE (item_id);")
            print("✓ 'item_id' is now UNIQUE!")
        except Exception as e:
            if "already exists" in str(e):
                print("✓ 'item_id' is already UNIQUE.")
            else:
                print(f"✗ Failed to make 'item_id' UNIQUE: {e}")

        print("Adding 'description' column if missing...")
        try:
            cursor.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;")
            print("✓ 'description' column ensured!")
        except Exception as e:
            print(f"✗ Failed to add 'description' column: {e}")

        print("Adding foreign key to messages...")
        try:
            cursor.execute("""
                ALTER TABLE messages 
                DROP CONSTRAINT IF EXISTS fk_messages_item;
                
                ALTER TABLE messages
                ADD CONSTRAINT fk_messages_item
                FOREIGN KEY (item_id) REFERENCES items(item_id)
                ON DELETE SET NULL;
            """)
            print("✓ Foreign key constraint fixed!")
        except Exception as e:
            print(f"✗ Failed to fix foreign key: {e}")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_constraints()
