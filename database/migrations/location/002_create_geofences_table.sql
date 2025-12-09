-- UP
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('safe_zone', 'restricted_zone')),
  center_latitude DECIMAL(10, 8) NOT NULL,
  center_longitude DECIMAL(11, 8) NOT NULL,
  radius DECIMAL(10, 2) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geofences_ward_id ON geofences(ward_id);
CREATE INDEX IF NOT EXISTS idx_geofences_enabled ON geofences(enabled);

-- DOWN
DROP INDEX IF EXISTS idx_geofences_enabled;
DROP INDEX IF EXISTS idx_geofences_ward_id;
DROP TABLE IF EXISTS geofences;

