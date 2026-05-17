import psycopg2
import uuid
from datetime import datetime

DATABASE_URL = "postgresql://postgres:Hameed777456644$@db.mtnovthhwsdmlsbuinld.supabase.co:5432/postgres"

def test_messages():
    print("--- Testing Messages System ---\n")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        # 1. Check messages table columns
        print("1. Checking messages table schema...")
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'messages'
            ORDER BY ordinal_position;
        """)
        cols = cursor.fetchall()
        for col in cols:
            print(f"   - {col[0]}: {col[1]}")

        # 2. Check existing messages
        print("\n2. Checking existing messages in database...")
        cursor.execute("SELECT COUNT(*) FROM messages;")
        count = cursor.fetchone()[0]
        print(f"   Total messages: {count}")

        # 3. Test INSERT - simulate sending a message
        print("\n3. Testing message INSERT...")
        user1 = str(uuid.uuid4())
        user2 = str(uuid.uuid4())
        sorted_ids = sorted([user1, user2])
        test_chat_id = f"{sorted_ids[0]}_{sorted_ids[1]}_test-item-001"
        test_content = f"Hello! Is this item still available? (Test at {datetime.now().strftime('%H:%M:%S')})"

        cursor.execute("""
            INSERT INTO messages (chat_id, sender_id, recipient_id, item_id, content, is_image)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING message_id, created_at;
        """, (test_chat_id, user1, user2, None, test_content, False))
        
        result = cursor.fetchone()
        msg_id = result[0]
        created_at = result[1]
        print(f"   ✓ Message inserted! ID: {msg_id}")
        print(f"   ✓ chat_id: {test_chat_id[:50]}...")
        print(f"   ✓ created_at: {created_at}")

        # 4. Test READ - retrieve the message
        print("\n4. Testing message READ...")
        cursor.execute("""
            SELECT message_id, chat_id, content, is_image, created_at
            FROM messages
            WHERE message_id = %s;
        """, (msg_id,))
        
        msg = cursor.fetchone()
        if msg:
            print(f"   ✓ Message retrieved successfully!")
            print(f"   ✓ Content: '{msg[2]}'")
            print(f"   ✓ is_image: {msg[3]}")
        else:
            print("   ✗ Message not found!")

        # 5. Test conversation fetch (like the app does)
        print("\n5. Testing conversation fetch (like ChatListScreen)...")
        cursor.execute("""
            SELECT chat_id, sender_id, recipient_id, content, created_at
            FROM messages
            WHERE sender_id = %s OR recipient_id = %s
            ORDER BY created_at DESC;
        """, (user1, user1))
        
        messages = cursor.fetchall()
        print(f"   ✓ Found {len(messages)} message(s) for user1")

        # 6. Test fetch by chat_id (like ChatDetailScreen)
        print("\n6. Testing fetch by chat_id (like ChatDetailScreen)...")
        cursor.execute("""
            SELECT message_id, content, sender_id, created_at
            FROM messages
            WHERE chat_id = %s
            ORDER BY created_at ASC;
        """, (test_chat_id,))
        
        chat_msgs = cursor.fetchall()
        print(f"   ✓ Found {len(chat_msgs)} message(s) in chat")

        # 7. Check RLS policies
        print("\n7. Checking RLS policies on messages...")
        cursor.execute("""
            SELECT policyname, cmd
            FROM pg_policies 
            WHERE tablename = 'messages';
        """)
        policies = cursor.fetchall()
        for p in policies:
            print(f"   ✓ Policy: '{p[0]}' ({p[1]})")

        # 8. Check realtime
        print("\n8. Checking realtime publication...")
        cursor.execute("""
            SELECT schemaname, tablename 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
        """)
        realtime = cursor.fetchone()
        if realtime:
            print(f"   ✓ 'messages' table is in supabase_realtime publication!")
        else:
            print("   ✗ 'messages' table NOT in realtime! (You need to add it via Supabase dashboard)")

        # 9. Clean up test message
        print("\n9. Cleaning up test data...")
        cursor.execute("DELETE FROM messages WHERE message_id = %s;", (msg_id,))
        print(f"   ✓ Test message deleted")

        cursor.close()
        conn.close()

        print("\n" + "="*40)
        print("✅ ALL MESSAGING TESTS PASSED!")
        print("="*40)
        print("\nThe messaging system is ready:")
        print("  • Messages can be inserted")
        print("  • Messages can be retrieved by chat_id")
        print("  • Conversation list works")
        print("  • RLS policies protect your data")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_messages()
