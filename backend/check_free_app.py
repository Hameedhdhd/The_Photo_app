import psycopg2
import sys

# Database connection
DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.awwahpecfvdljgupnzft.supabase.co:5432/postgres"

def check_table():
    print(f"Connecting to database to check Free_APP table...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Free_APP');")
        exists = cursor.fetchone()[0]
        
        if not exists:
            print("Table 'Free_APP' does not exist!")
            return
        
        print("Table 'Free_APP' exists. Checking columns...")
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Free_APP'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\n'Free_APP' table columns:")
        for col, dtype in columns:
            print(f"  - {col} ({dtype})")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_table()
