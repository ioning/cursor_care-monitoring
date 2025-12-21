-- UP
-- Add organization_id to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_ward_organization ON locations(ward_id, organization_id);

-- Add organization_id to geofences table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geofences') THEN
    ALTER TABLE geofences 
    ADD COLUMN IF NOT EXISTS organization_id UUID;

    CREATE INDEX IF NOT EXISTS idx_geofences_organization_id ON geofences(organization_id);
    CREATE INDEX IF NOT EXISTS idx_geofences_ward_organization ON geofences(ward_id, organization_id);
  END IF;
END $$;

-- DOWN
DROP INDEX IF EXISTS idx_geofences_ward_organization;
DROP INDEX IF EXISTS idx_geofences_organization_id;
DROP INDEX IF EXISTS idx_locations_ward_organization;
DROP INDEX IF EXISTS idx_locations_organization_id;

ALTER TABLE geofences DROP COLUMN IF EXISTS organization_id;
ALTER TABLE locations DROP COLUMN IF EXISTS organization_id;
