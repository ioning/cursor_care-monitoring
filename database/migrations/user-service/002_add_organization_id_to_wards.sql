-- UP Migration: Add organization_id to wards table for multi-tenancy
ALTER TABLE wards ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_wards_organization_id ON wards(organization_id);
CREATE INDEX IF NOT EXISTS idx_wards_organization_status ON wards(organization_id, status);

-- Remove default after migration
-- ALTER TABLE wards ALTER COLUMN organization_id DROP DEFAULT;

-- DOWN Migration
DROP INDEX IF EXISTS idx_wards_organization_status;
DROP INDEX IF EXISTS idx_wards_organization_id;
ALTER TABLE wards DROP COLUMN IF EXISTS organization_id;


ALTER TABLE wards ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_wards_organization_id ON wards(organization_id);
CREATE INDEX IF NOT EXISTS idx_wards_organization_status ON wards(organization_id, status);

-- Remove default after migration
-- ALTER TABLE wards ALTER COLUMN organization_id DROP DEFAULT;

-- DOWN Migration
DROP INDEX IF EXISTS idx_wards_organization_status;
DROP INDEX IF EXISTS idx_wards_organization_id;
ALTER TABLE wards DROP COLUMN IF EXISTS organization_id;







