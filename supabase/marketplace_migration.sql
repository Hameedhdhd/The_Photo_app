-- ============================================================
-- Migration: Add Marketplace Features (Messaging, Addresses, Maps)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add address and location columns to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE items
ADD COLUMN IF NOT EXISTS latitude FLOAT8;

ALTER TABLE items
ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- 2. Update status column default from 'draft' to 'listed' for marketplace
ALTER TABLE items
ALTER COLUMN status SET DEFAULT 'listed';

-- 3. Remove 'room' column (not needed for marketplace)
-- Uncomment if you want to remove it:
-- ALTER TABLE items DROP COLUMN IF EXISTS room;

-- 4. Remove bilingual description columns (use single description)
-- Uncomment if you want to remove them:
-- ALTER TABLE items DROP COLUMN IF EXISTS description_en;
-- ALTER TABLE items DROP COLUMN IF EXISTS description_de;

-- 5. Add single description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'description') THEN
    ALTER TABLE items ADD COLUMN description TEXT;
  END IF;
END $$;

-- 6. Create messages table for real-time chat
CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,  -- Groups messages by buyer-seller-item combo (Format: user1_user2_itemid)
  sender_id UUID NOT NULL,  -- User ID of the sender
  recipient_id UUID NOT NULL,  -- User ID of the recipient
  item_id TEXT,  -- Reference to the item being discussed
  content TEXT NOT NULL,
  is_image BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 8. Add foreign key constraints for messages
ALTER TABLE messages
ADD CONSTRAINT fk_messages_item
FOREIGN KEY (item_id) REFERENCES items(item_id)
ON DELETE SET NULL;

-- ============================================================
-- Enable Row Level Security for messages table
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Anonymous users can view messages" ON messages;
DROP POLICY IF EXISTS "Anonymous users can send messages" ON messages;

-- Policies for ANONYMOUS access (development phase)
CREATE POLICY "Anonymous users can view messages"
ON messages FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anonymous users can send messages"
ON messages FOR INSERT
TO anon
WITH CHECK (true);

-- Policies for AUTHENTICATED users (production)
CREATE POLICY "Users can view messages in their chats"
ON messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- Enable Realtime for messages table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- Update API View (must recreate after schema changes)
-- ============================================================
DROP VIEW IF EXISTS api.items CASCADE;
CREATE VIEW api.items
WITH (security_invoker=on)
AS SELECT * FROM public.items;

-- Recreate view for messages
DROP VIEW IF EXISTS api.messages CASCADE;
CREATE VIEW api.messages
WITH (security_invoker=on)
AS SELECT * FROM public.messages;

-- Grant permissions on views
GRANT ALL ON SCHEMA api TO service_role;
GRANT SELECT, INSERT ON api.items TO anon;
GRANT SELECT, INSERT ON api.items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.messages TO anon;
GRANT SELECT, INSERT ON api.messages TO authenticated;