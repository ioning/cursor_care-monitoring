-- UP Migration: Create default organization for existing users
-- This is the "primary" organization for unassigned devices
INSERT INTO organizations (id, name, slug, status, subscription_tier, device_serial_numbers)
VALUES ('00000000-0000-0000-0000-000000000000', 'Primary Organization', 'primary', 'active', 'enterprise', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET name = 'Primary Organization', slug = 'primary', device_serial_numbers = COALESCE(organizations.device_serial_numbers, '[]'::jsonb);

-- Update existing users to belong to default organization
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

-- Update existing wards to belong to default organization
UPDATE wards 
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL OR organization_id = '00000000-0000-0000-0000-000000000000';

-- DOWN Migration
UPDATE users SET organization_id = NULL WHERE organization_id = '00000000-0000-0000-0000-000000000000';
UPDATE wards SET organization_id = NULL WHERE organization_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000000';


INSERT INTO organizations (id, name, slug, status, subscription_tier)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Organization', 'default', 'active', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Update existing users to belong to default organization
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

-- Update existing wards to belong to default organization
UPDATE wards 
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL OR organization_id = '00000000-0000-0000-0000-000000000000';

-- DOWN Migration
UPDATE users SET organization_id = NULL WHERE organization_id = '00000000-0000-0000-0000-000000000000';
UPDATE wards SET organization_id = NULL WHERE organization_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000000';







