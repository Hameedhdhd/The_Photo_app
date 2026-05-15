import psycopg2
import os

DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"
MIGRATION_FILE = "supabase/marketplace_migration.sql"

def run_migration():
    print(f"Reading migration file {MIGRATION_FILE}...")
    with open(MIGRATION_FILE, 'r') as f:
        sql = f.read()

    print("Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Executing migration SQL...")
        # Split by semicolon but handle the DO block carefully
        # Actually, let's just try executing the whole block if possible, 
        # but psycopg2 might struggle with some SQL features.
        # Let's try executing it as one block first.
        try:
            cursor.execute(sql)
            print("✓ Migration executed successfully!")
        except Exception as e:
            print(f"✗ Migration failed: {e}")
            print("Trying to execute statement by statement...")
            # Very basic split (won't handle nested semicolons in strings/functions well)
            statements = sql.split(';')
            for i, stmt in enumerate(statements):
                stmt = stmt.strip()
                if not stmt: continue
                try:
                    cursor.execute(stmt)
                    print(f"  ✓ Statement {i+1} executed")
                except Exception as stmt_e:
                    print(f"  ✗ Statement {i+1} failed: {stmt_e}")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_migration()
