"""
Create the chat_images storage bucket and set policies.
"""
import psycopg2

DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

migrations = [
    # Create the storage bucket if it doesn't exist
    """
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('chat_images', 'chat_images', true)
    ON CONFLICT (id) DO NOTHING;
    """,
    
    # Allow anyone to view images (public bucket)
    """
    DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
    """,
    """
    CREATE POLICY "Anyone can view chat images" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'chat_images');
    """,
    
    # Allow service role to upload images
    """
    DROP POLICY IF EXISTS "Service role can upload chat images" ON storage.objects;
    """,
    """
    CREATE POLICY "Service role can upload chat images" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'chat_images');
    """,
    
    # Allow service role to update images
    """
    DROP POLICY IF EXISTS "Service role can update chat images" ON storage.objects;
    """,
    """
    CREATE POLICY "Service role can update chat images" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'chat_images');
    """,
    
    # Allow service role to delete images
    """
    DROP POLICY IF EXISTS "Service role can delete chat images" ON storage.objects;
    """,
    """
    CREATE POLICY "Service role can delete chat images" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'chat_images');
    """,
    
    # Also allow anon to upload (for development)
    """
    DROP POLICY IF EXISTS "Anonymous can upload chat images" ON storage.objects;
    """,
    """
    CREATE POLICY "Anonymous can upload chat images" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'chat_images');
    """,
    
    # Allow authenticated users to upload their own images
    """
    DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
    """,
    """
    CREATE POLICY "Authenticated users can upload chat images" 
    ON storage.objects FOR INSERT 
    TO authenticated
    WITH CHECK (bucket_id = 'chat_images');
    """
]

def run_migration():
    print("Setting up chat_images storage bucket and policies...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        print("✓ Connected to database")
        
        for i, sql in enumerate(migrations, 1):
            try:
                cursor.execute(sql)
                print(f"  ✓ Step {i}/{len(migrations)} executed")
            except psycopg2.Error as e:
                if "already exists" in str(e).lower():
                    print(f"  ⚠ Step {i}/{len(migrations)} skipped (already exists)")
                else:
                    print(f"  ✗ Step {i}/{len(migrations)} error: {e}")
        
        # Verify bucket exists
        cursor.execute("SELECT id, name, public FROM storage.buckets WHERE id = 'chat_images';")
        bucket = cursor.fetchone()
        if bucket:
            print(f"\n✓ Storage bucket '{bucket[0]}' exists (public={bucket[2]})")
        else:
            print("\n✗ Storage bucket not found!")
        
        # Verify policies
        cursor.execute("SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%chat images%';")
        policies = cursor.fetchall()
        print(f"✓ Storage policies: {[p[0] for p in policies]}")
        
        cursor.close()
        conn.close()
        print("\n✓ Chat storage setup completed!")
        
    except psycopg2.Error as e:
        print(f"✗ Database error: {e}")

if __name__ == "__main__":
    run_migration()
