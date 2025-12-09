-- UP Migration: Add organization_id to alerts for direct tenant filtering
-- Alerts are linked to wards, but adding organization_id directly improves query performance

-- First, add organization_id column (nullable initially for migration)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update existing alerts with organization_id from wards
UPDATE alerts a
SET organization_id = (
  SELECT w.organization_id 
  FROM wards w 
  WHERE w.id = a.ward_id
)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration
ALTER TABLE alerts ALTER COLUMN organization_id SET NOT NULL;

-- Add index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_organization_status ON alerts(organization_id, status, created_at DESC);

-- DOWN Migration
DROP INDEX IF EXISTS idx_alerts_organization_status;
DROP INDEX IF EXISTS idx_alerts_organization_id;
ALTER TABLE alerts DROP COLUMN IF EXISTS organization_id;


-- Alerts are linked to wards, but adding organization_id directly improves query performance

-- First, add organization_id column (nullable initially for migration)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update existing alerts with organization_id from wards
UPDATE alerts a
SET organization_id = (
  SELECT w.organization_id 
  FROM wards w 
  WHERE w.id = a.ward_id
)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration
ALTER TABLE alerts ALTER COLUMN organization_id SET NOT NULL;

-- Add index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_organization_status ON alerts(organization_id, status, created_at DESC);

-- DOWN Migration
DROP INDEX IF EXISTS idx_alerts_organization_status;
DROP INDEX IF EXISTS idx_alerts_organization_id;
ALTER TABLE alerts DROP COLUMN IF EXISTS organization_id;







