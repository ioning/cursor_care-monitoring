-- UP
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  source VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_ward_id ON locations(ward_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_locations_ward_timestamp ON locations(ward_id, timestamp DESC);

-- Add PostGIS extension for geospatial queries (optional)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE locations ADD COLUMN geom GEOMETRY(POINT, 4326);
-- CREATE INDEX idx_locations_geom ON locations USING GIST(geom);

-- DOWN
DROP INDEX IF EXISTS idx_locations_ward_timestamp;
DROP INDEX IF EXISTS idx_locations_timestamp;
DROP INDEX IF EXISTS idx_locations_ward_id;
DROP TABLE IF EXISTS locations;

