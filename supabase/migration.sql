-- ============================================================
-- Migration: Add auth support + user_id linkage to items table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/awwahpecfvdljgupnzft/sql/new)
-- ============================================================

-- 1. Add user_id column to link items to authenticated users
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Add image_url column for storing uploaded photo references
ALTER TABLE items
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Add created_at for sorting listings
ALTER TABLE items
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Add updated_at for tracking edits
ALTER TABLE items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Enable Row Level Security (important: prevents users from seeing each other's items)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 6. Policy: users can only SELECT their own items
CREATE POLICY "Users can view their own items"
ON items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 7. Policy: users can only INSERT items with their own user_id
CREATE POLICY "Users can insert their own items"
ON items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 8. Policy: users can only UPDATE their own items
CREATE POLICY "Users can update their own items"
ON items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Policy: users can only DELETE their own items
CREATE POLICY "Users can delete their own items"
ON items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 10. Enable row-level security on the storage bucket for user images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item_images', 'item_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view any image"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'item_images');

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item_images' AND auth.role() = 'authenticated');
