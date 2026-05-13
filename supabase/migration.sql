-- ============================================================
-- Migration: Fix items table schema for the Photo App
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/awwahpecfvdljgupnzft/sql/new
-- ============================================================

-- 1. Add a proper primary key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'id') THEN
    ALTER TABLE items ADD COLUMN id BIGSERIAL PRIMARY KEY;
  END IF;
END $$;

-- 2. Add user_id column to link items to authenticated users
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Add image_url column for storing uploaded photo references
ALTER TABLE items
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Add created_at for sorting listings
ALTER TABLE items
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Add updated_at for tracking edits
ALTER TABLE items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Add favorite column for favorites feature
ALTER TABLE items
ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT false;

-- 7. Enable Row Level Security (important: prevents users from seeing each other's items)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies for ANONYMOUS access (mock login / development phase)
-- These allow the app to work before full auth is activated.
-- ============================================================

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Anonymous users can view all items" ON items;
DROP POLICY IF EXISTS "Anonymous users can insert items" ON items;
DROP POLICY IF EXISTS "Anonymous users can update items" ON items;
DROP POLICY IF EXISTS "Anonymous users can delete items" ON items;

CREATE POLICY "Anonymous users can view all items"
ON items FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anonymous users can insert items"
ON items FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anonymous users can update items"
ON items FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Anonymous users can delete items"
ON items FOR DELETE
TO anon
USING (true);

-- ============================================================
-- Policies for AUTHENTICATED users (real login - for later)
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own items" ON items;
DROP POLICY IF EXISTS "Users can insert their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;

CREATE POLICY "Users can view their own items"
ON items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
ON items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
ON items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
ON items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for item images
-- ============================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('item_images', 'item_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anonymous users can view images" ON storage.objects;
CREATE POLICY "Anonymous users can view images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'item_images');

-- ============================================================
-- API Schema View (exposes public.items to REST API)
-- The Supabase project is configured to only expose the 'api' schema.
-- This view bridges public.items to the REST API.
-- ============================================================

DROP VIEW IF EXISTS api.items CASCADE;
CREATE VIEW api.items AS SELECT * FROM public.items;

-- Grant permissions on the view
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
