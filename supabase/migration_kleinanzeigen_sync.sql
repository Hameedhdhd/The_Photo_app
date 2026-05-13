-- ============================================================
-- Migration: Add listing tracking columns for Kleinanzeigen Sync
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ============================================================

-- 1. Add listing_status column to track marketplace listing state
-- Values: 'draft', 'listed_kleinanzeigen', 'listed_ebay', 'sold'
ALTER TABLE items
ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'draft';

-- 2. Add listed_at timestamp to track when item was listed
ALTER TABLE items
ADD COLUMN IF NOT EXISTS listed_at TIMESTAMPTZ;

-- 3. Add listing_url to store the marketplace listing URL after publishing
ALTER TABLE items
ADD COLUMN IF NOT EXISTS listing_url TEXT;

-- 4. Create an index on listing_status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_items_listing_status ON items(listing_status);

-- 5. Create an index on user_id + listing_status for the Chrome Extension queries
CREATE INDEX IF NOT EXISTS idx_items_user_listing_status ON items(user_id, listing_status);

-- ============================================================
-- Update the api.items view to include new columns
-- Since the view is `SELECT *`, it should automatically include
-- new columns added to public.items. But let's refresh it
-- to be safe (Postgres views don't always auto-update).
-- ============================================================

DROP VIEW IF EXISTS api.items CASCADE;
CREATE VIEW api.items
WITH (security_invoker=on)
AS SELECT * FROM public.items;

-- Re-grant permissions on the view
GRANT ALL ON SCHEMA api TO service_role;
GRANT SELECT ON api.items TO anon;
GRANT SELECT ON api.items TO authenticated;
GRANT INSERT ON api.items TO anon;
GRANT INSERT ON api.items TO authenticated;
GRANT UPDATE ON api.items TO anon;
GRANT UPDATE ON api.items TO authenticated;
GRANT DELETE ON api.items TO anon;
GRANT DELETE ON api.items TO authenticated;
GRANT ALL ON api.items TO service_role;

-- ============================================================
-- RLS Policies for the new columns (existing policies still apply)
-- The existing policies already cover SELECT/UPDATE for both
-- anon and authenticated users, so no new policies needed.
-- ============================================================

-- Verify the migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'listing_status'
  ) THEN
    RAISE NOTICE '✅ listing_status column added successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'listed_at'
  ) THEN
    RAISE NOTICE '✅ listed_at column added successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'listing_url'
  ) THEN
    RAISE NOTICE '✅ listing_url column added successfully';
  END IF;
END $$;