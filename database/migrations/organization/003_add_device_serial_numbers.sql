-- UP Migration: Add device_serial_numbers to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS device_serial_numbers JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient searching
CREATE INDEX IF NOT EXISTS idx_organizations_device_serial_numbers ON organizations USING GIN (device_serial_numbers);

-- Add comment
COMMENT ON COLUMN organizations.device_serial_numbers IS 'Array of device serial numbers assigned to this organization';

-- DOWN Migration
DROP INDEX IF EXISTS idx_organizations_device_serial_numbers;
ALTER TABLE organizations DROP COLUMN IF EXISTS device_serial_numbers;

