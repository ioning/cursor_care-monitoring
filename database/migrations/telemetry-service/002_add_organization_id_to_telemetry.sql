-- UP Migration: Add organization_id to raw_metrics for direct tenant filtering
-- Telemetry is linked to wards, but adding organization_id directly improves query performance

-- First, add organization_id column (nullable initially for migration)
ALTER TABLE raw_metrics ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update existing metrics with organization_id from wards
UPDATE raw_metrics rm
SET organization_id = (
  SELECT w.organization_id 
  FROM wards w 
  WHERE w.id = rm.ward_id
)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration
ALTER TABLE raw_metrics ALTER COLUMN organization_id SET NOT NULL;

-- Add indexes for tenant filtering
CREATE INDEX IF NOT EXISTS idx_raw_metrics_organization_id ON raw_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_raw_metrics_organization_timestamp ON raw_metrics(organization_id, timestamp DESC);

-- DOWN Migration
DROP INDEX IF EXISTS idx_raw_metrics_organization_timestamp;
DROP INDEX IF EXISTS idx_raw_metrics_organization_id;
ALTER TABLE raw_metrics DROP COLUMN IF EXISTS organization_id;


-- Telemetry is linked to wards, but adding organization_id directly improves query performance

-- First, add organization_id column (nullable initially for migration)
ALTER TABLE raw_metrics ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update existing metrics with organization_id from wards
UPDATE raw_metrics rm
SET organization_id = (
  SELECT w.organization_id 
  FROM wards w 
  WHERE w.id = rm.ward_id
)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration
ALTER TABLE raw_metrics ALTER COLUMN organization_id SET NOT NULL;

-- Add indexes for tenant filtering
CREATE INDEX IF NOT EXISTS idx_raw_metrics_organization_id ON raw_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_raw_metrics_organization_timestamp ON raw_metrics(organization_id, timestamp DESC);

-- DOWN Migration
DROP INDEX IF EXISTS idx_raw_metrics_organization_timestamp;
DROP INDEX IF EXISTS idx_raw_metrics_organization_id;
ALTER TABLE raw_metrics DROP COLUMN IF EXISTS organization_id;







