-- UP
-- Add polygon support and allow disabling/enabling geofences.
-- We keep `type` as ('safe_zone'|'restricted_zone') and introduce `shape` ('circle'|'polygon').

ALTER TABLE geofences
  ADD COLUMN IF NOT EXISTS shape VARCHAR(20) NOT NULL DEFAULT 'circle' CHECK (shape IN ('circle', 'polygon'));

ALTER TABLE geofences
  ADD COLUMN IF NOT EXISTS polygon_points JSONB;

-- For polygon geofences circle-specific fields may be null
ALTER TABLE geofences
  ALTER COLUMN center_latitude DROP NOT NULL,
  ALTER COLUMN center_longitude DROP NOT NULL,
  ALTER COLUMN radius DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_geofences_shape ON geofences(shape);
CREATE INDEX IF NOT EXISTS idx_geofences_polygon_points_gin ON geofences USING GIN (polygon_points);

-- DOWN
DROP INDEX IF EXISTS idx_geofences_polygon_points_gin;
DROP INDEX IF EXISTS idx_geofences_shape;

ALTER TABLE geofences
  ALTER COLUMN center_latitude SET NOT NULL,
  ALTER COLUMN center_longitude SET NOT NULL,
  ALTER COLUMN radius SET NOT NULL;

ALTER TABLE geofences
  DROP COLUMN IF EXISTS polygon_points;

ALTER TABLE geofences
  DROP COLUMN IF EXISTS shape;


