-- Add structured address columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS street_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS country TEXT;

-- Update existing rows to parse address if possible (optional, but good for data integrity)
-- This is a simple split, might not be perfect for all addresses but helps
UPDATE items 
SET street_name = split_part(address, ',', 1),
    city = split_part(split_part(address, ',', 2), ' ', 3),
    postal_code = split_part(split_part(address, ',', 2), ' ', 2),
    country = split_part(address, ',', 3)
WHERE address IS NOT NULL AND street_name IS NULL;
