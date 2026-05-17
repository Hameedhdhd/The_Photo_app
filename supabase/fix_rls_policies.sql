-- ============================================================
-- FIX: RLS Policies for 'items' table
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mtnovthhwsdmlsbuinld/sql
-- ============================================================

-- Step 1: Check current policies (for reference)
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'items'
ORDER BY cmd;

-- Step 2: Drop old/conflicting policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.items;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.items;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.items;
DROP POLICY IF EXISTS "Users can insert own items" ON public.items;
DROP POLICY IF EXISTS "Users can view all listed items" ON public.items;
DROP POLICY IF EXISTS "Users can update own items" ON public.items;
DROP POLICY IF EXISTS "Users can delete own items" ON public.items;
DROP POLICY IF EXISTS "Anyone can view listed items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.items;

-- Step 3: Make sure RLS is enabled
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Step 4: Allow ANYONE to read listed items (marketplace browsing)
CREATE POLICY "Anyone can view listed items"
  ON public.items
  FOR SELECT
  TO anon, authenticated
  USING (status = 'listed' OR auth.uid() = user_id);

-- Step 5: Allow AUTHENTICATED users to insert their own items
CREATE POLICY "Authenticated users can insert items"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Allow users to UPDATE their own items
CREATE POLICY "Users can update own items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 7: Allow users to DELETE their own items
CREATE POLICY "Users can delete own items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 8: Verify policies were created
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'items'
ORDER BY cmd;
