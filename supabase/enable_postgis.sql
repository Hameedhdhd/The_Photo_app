-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add a geography column to the items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Create a GIST index for high-performance spatial queries
CREATE INDEX IF NOT EXISTS items_location_idx ON items USING GIST (location);

-- Function to update the location column based on latitude/longitude
CREATE OR REPLACE FUNCTION update_item_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep location in sync with latitude/longitude
DROP TRIGGER IF EXISTS tr_update_item_location ON items;
CREATE TRIGGER tr_update_item_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON items
FOR EACH ROW
EXECUTE FUNCTION update_item_location();

-- Initial migration: Populate location column for existing rows
UPDATE items 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;
