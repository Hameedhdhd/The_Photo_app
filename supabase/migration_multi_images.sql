-- Add support for multiple images
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Migrate existing image_url to the new array (optional but helpful)
UPDATE items SET image_urls = jsonb_build_array(image_url) WHERE image_url IS NOT NULL AND (image_urls IS NULL OR image_urls = '[]'::jsonb);
