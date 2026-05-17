-- ============================================================
-- Migration: Add Categories Table
-- ============================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    label_de TEXT,
    icon TEXT,
    parent_id BIGINT REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 3. Create public SELECT policy
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (true);

-- 4. Add category_id to items table (optional, but good for future)
-- For now we'll keep the string 'category' in items table for backward compatibility,
-- but adding a FK allows for better data integrity later.
-- ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);

-- 5. Comments for clarity
COMMENT ON TABLE categories IS 'Store hierarchical marketplace categories';
COMMENT ON COLUMN categories.slug IS 'URL-friendly name (e.g. electronics)';
COMMENT ON COLUMN categories.label IS 'Display name in English';
COMMENT ON COLUMN categories.label_de IS 'Display name in German';
COMMENT ON COLUMN categories.icon IS 'Ionicons name';
