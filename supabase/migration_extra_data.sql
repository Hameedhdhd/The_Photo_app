-- Add extra_data JSONB column for structured AI data (specs, highlights, condition)
ALTER TABLE items ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN items.extra_data IS 'Structured AI-generated data: specs, highlights, condition for rich description formatting';