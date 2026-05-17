"""
Run database migrations directly on Supabase PostgreSQL.
"""
import psycopg2
from psycopg2 import sql

# Database connection
DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.awwahpecfvdljgupnzft.supabase.co:5432/postgres"

# Migration SQL statements
migrations = [
    # Add id column as primary key
    """
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'id') THEN
        ALTER TABLE items ADD COLUMN id BIGSERIAL PRIMARY KEY;
      END IF;
    END $$;
    """,
    
    # Add user_id column
    """
    ALTER TABLE items ADD COLUMN IF NOT EXISTS user_id UUID;
    """,
    
    # Add image_url column
    """
    ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;
    """,
    
    # Add created_at column
    """
    ALTER TABLE items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    """,
    
    # Add updated_at column
    """
    ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    """,
    
    # Enable RLS
    """
    ALTER TABLE items ENABLE ROW LEVEL SECURITY;
    """,
    
    # Drop existing policies
    """
    DROP POLICY IF EXISTS "Anonymous users can view all items" ON items;
    """,
    """
    DROP POLICY IF EXISTS "Anonymous users can insert items" ON items;
    """,
    """
    DROP POLICY IF EXISTS "Anonymous users can update items" ON items;
    """,
    """
    DROP POLICY IF EXISTS "Anonymous users can delete items" ON items;
    """,
    
    # Create policies for anonymous access
    """
    CREATE POLICY "Anonymous users can view all items" ON items FOR SELECT TO anon USING (true);
    """,
    """
    CREATE POLICY "Anonymous users can insert items" ON items FOR INSERT TO anon WITH CHECK (true);
    """,
    """
    CREATE POLICY "Anonymous users can update items" ON items FOR UPDATE TO anon USING (true);
    """,
    """
    CREATE POLICY "Anonymous users can delete items" ON items FOR DELETE TO anon USING (true);
    """,
    
    # Drop existing authenticated policies
    """
    DROP POLICY IF EXISTS "Users can view their own items" ON items;
    """,
    """
    DROP POLICY IF EXISTS "Users can insert their own items" ON items;
    """,
    """
    DROP POLICY IF EXISTS "Users can update their own items" ON items;
    """,
    """
    DROP POLICY IF EXISTS "Users can delete their own items" ON items;
    """,
    
    # Create policies for authenticated users
    """
    CREATE POLICY "Users can view their own items" ON items FOR SELECT TO authenticated USING (auth.uid() = user_id);
    """,
    """
    CREATE POLICY "Users can insert their own items" ON items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    """,
    """
    CREATE POLICY "Users can update their own items" ON items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    """,
    """
    CREATE POLICY "Users can delete their own items" ON items FOR DELETE TO authenticated USING (auth.uid() = user_id);
    """,
]

def run_migration():
    print("Connecting to Supabase PostgreSQL...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True  # Required for DDL statements
        cursor = conn.cursor()
        
        print("✓ Connected successfully!")
        print("\nRunning migrations...\n")
        
        for i, migration in enumerate(migrations, 1):
            try:
                cursor.execute(migration)
                print(f"  ✓ Migration {i}/{len(migrations)} executed")
            except psycopg2.Error as e:
                # Some errors are expected (like "policy already exists")
                if "already exists" in str(e).lower():
                    print(f"  ⚠ Migration {i}/{len(migrations)} skipped (already exists)")
                else:
                    print(f"  ✗ Migration {i}/{len(migrations)} error: {e}")
        
        # Verify the changes
        print("\nVerifying table structure...")
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'items'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\nCurrent items table columns:")
        for col, dtype in columns:
            print(f"  - {col} ({dtype})")
        
        cursor.close()
        conn.close()
        
        print("\n✓ Migration completed successfully!")
        
    except psycopg2.Error as e:
        print(f"✗ Database error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    run_migration()