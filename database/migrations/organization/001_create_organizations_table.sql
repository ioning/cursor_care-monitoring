-- UP Migration: Create organizations table for multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
  subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise', 'custom')),
  subscription_plan_id UUID,
  max_wards INTEGER,
  max_dispatchers INTEGER,
  max_guardians INTEGER,
  features JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  billing_email VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address JSONB,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);

-- DOWN Migration
DROP INDEX IF EXISTS idx_organizations_subscription_tier;
DROP INDEX IF EXISTS idx_organizations_status;
DROP INDEX IF EXISTS idx_organizations_slug;
DROP TABLE IF EXISTS organizations;


CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
  subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise', 'custom')),
  subscription_plan_id UUID,
  max_wards INTEGER,
  max_dispatchers INTEGER,
  max_guardians INTEGER,
  features JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  billing_email VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address JSONB,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);

-- DOWN Migration
DROP INDEX IF EXISTS idx_organizations_subscription_tier;
DROP INDEX IF EXISTS idx_organizations_status;
DROP INDEX IF EXISTS idx_organizations_slug;
DROP TABLE IF EXISTS organizations;







