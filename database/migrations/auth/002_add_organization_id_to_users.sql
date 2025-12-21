-- UP
-- Add organization_id to users table for multi-tenancy
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Drop old unique constraint on email
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Add new unique constraint on email + organization_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_organization 
ON users(email, organization_id) 
WHERE organization_id IS NOT NULL;

-- Keep unique index on email for users without organization (backward compatibility)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_null_org 
ON users(email) 
WHERE organization_id IS NULL;

-- Add index for organization_id
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Update role check to include organization_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('guardian', 'ward', 'dispatcher', 'admin', 'organization_admin'));

-- DOWN Migration
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('guardian', 'ward', 'dispatcher', 'admin'));

DROP INDEX IF EXISTS idx_users_organization_id;
DROP INDEX IF EXISTS idx_users_email_null_org;
DROP INDEX IF EXISTS idx_users_email_organization;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;

