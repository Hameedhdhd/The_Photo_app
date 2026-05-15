import psycopg2

DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

def ensure_columns():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()

    columns_to_add = [
        ("listed_at", "TIMESTAMP WITH TIME ZONE"),
        ("address", "TEXT"),
        ("latitude", "FLOAT8"),
        ("longitude", "FLOAT8"),
        ("description", "TEXT"),
        ("favorite", "BOOLEAN DEFAULT false"),
        ("status", "TEXT DEFAULT 'draft'"),
    ]

    print("Ensuring all required columns exist in `items` table...")
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE items ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
            print(f"  ✓ {col_name} ({col_type})")
        except Exception as e:
            print(f"  ✗ {col_name}: {e}")

    # Add RLS policy if not present
    try:
        cursor.execute("ALTER TABLE items ENABLE ROW LEVEL SECURITY;")
        print("✓ RLS enabled on items")
    except: pass

    try:
        cursor.execute("DROP POLICY IF EXISTS \"Enable all for all\" ON items;")
        cursor.execute("CREATE POLICY \"Enable all for all\" ON items FOR ALL USING (true) WITH CHECK (true);")
        print("✓ RLS policy set on items")
    except Exception as e:
        print(f"✗ RLS policy: {e}")

    cursor.close()
    conn.close()
    print("\n✅ Done!")

if __name__ == "__main__":
    ensure_columns()
