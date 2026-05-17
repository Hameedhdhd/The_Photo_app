-- SQL Migration for Free_APP (awwahpecfvdljgupnzft)
-- Add missing columns to support the new features

ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS street_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS country TEXT;

-- Update description from existing legacy columns if needed
UPDATE items 
SET description = COALESCE(description_en, description_de)
WHERE description IS NULL AND (description_en IS NOT NULL OR description_de IS NOT NULL);
