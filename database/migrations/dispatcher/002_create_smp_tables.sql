-- UP Migration: Create SMP (Emergency Medical Services) tables

-- Table for SMP providers
CREATE TABLE IF NOT EXISTS smp_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  contract_number VARCHAR(100),
  contract_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  service_area VARCHAR(255),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for service prices
CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(100) NOT NULL UNIQUE,
  service_name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  currency VARCHAR(3) DEFAULT 'RUB',
  unit VARCHAR(50) NOT NULL, -- 'per_call', 'per_hour', 'per_km', 'per_day', 'per_month'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for SMP calls (linking emergency calls with SMP providers)
CREATE TABLE IF NOT EXISTS smp_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL,
  smp_provider_id UUID NOT NULL REFERENCES smp_providers(id),
  service_type VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.0,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'RUB',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  called_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (call_id) REFERENCES emergency_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (service_type) REFERENCES service_prices(service_type)
);

-- Indexes for smp_providers
CREATE INDEX IF NOT EXISTS idx_smp_providers_active ON smp_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_smp_providers_organization ON smp_providers(organization_id);

-- Indexes for service_prices
CREATE INDEX IF NOT EXISTS idx_service_prices_active ON service_prices(is_active);
CREATE INDEX IF NOT EXISTS idx_service_prices_type ON service_prices(service_type);
CREATE INDEX IF NOT EXISTS idx_service_prices_organization ON service_prices(organization_id);

-- Indexes for smp_calls
CREATE INDEX IF NOT EXISTS idx_smp_calls_call_id ON smp_calls(call_id);
CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_id ON smp_calls(smp_provider_id);
CREATE INDEX IF NOT EXISTS idx_smp_calls_status ON smp_calls(status);
CREATE INDEX IF NOT EXISTS idx_smp_calls_called_at ON smp_calls(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_smp_calls_organization ON smp_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_smp_calls_service_type ON smp_calls(service_type);

-- Composite index for cost summary queries
CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_status_date ON smp_calls(smp_provider_id, status, called_at DESC);

-- DOWN Migration
DROP INDEX IF EXISTS idx_smp_calls_provider_status_date;
DROP INDEX IF EXISTS idx_smp_calls_service_type;
DROP INDEX IF EXISTS idx_smp_calls_organization;
DROP INDEX IF EXISTS idx_smp_calls_called_at;
DROP INDEX IF EXISTS idx_smp_calls_status;
DROP INDEX IF EXISTS idx_smp_calls_provider_id;
DROP INDEX IF EXISTS idx_smp_calls_call_id;
DROP INDEX IF EXISTS idx_service_prices_organization;
DROP INDEX IF EXISTS idx_service_prices_type;
DROP INDEX IF EXISTS idx_service_prices_active;
DROP INDEX IF EXISTS idx_smp_providers_organization;
DROP INDEX IF EXISTS idx_smp_providers_active;

DROP TABLE IF EXISTS smp_calls;
DROP TABLE IF EXISTS service_prices;
DROP TABLE IF EXISTS smp_providers;




-- Table for SMP providers
CREATE TABLE IF NOT EXISTS smp_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  contract_number VARCHAR(100),
  contract_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  service_area VARCHAR(255),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for service prices
CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(100) NOT NULL UNIQUE,
  service_name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  currency VARCHAR(3) DEFAULT 'RUB',
  unit VARCHAR(50) NOT NULL, -- 'per_call', 'per_hour', 'per_km', 'per_day', 'per_month'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for SMP calls (linking emergency calls with SMP providers)
CREATE TABLE IF NOT EXISTS smp_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL,
  smp_provider_id UUID NOT NULL REFERENCES smp_providers(id),
  service_type VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.0,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'RUB',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  called_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (call_id) REFERENCES emergency_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (service_type) REFERENCES service_prices(service_type)
);

-- Indexes for smp_providers
CREATE INDEX IF NOT EXISTS idx_smp_providers_active ON smp_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_smp_providers_organization ON smp_providers(organization_id);

-- Indexes for service_prices
CREATE INDEX IF NOT EXISTS idx_service_prices_active ON service_prices(is_active);
CREATE INDEX IF NOT EXISTS idx_service_prices_type ON service_prices(service_type);
CREATE INDEX IF NOT EXISTS idx_service_prices_organization ON service_prices(organization_id);

-- Indexes for smp_calls
CREATE INDEX IF NOT EXISTS idx_smp_calls_call_id ON smp_calls(call_id);
CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_id ON smp_calls(smp_provider_id);
CREATE INDEX IF NOT EXISTS idx_smp_calls_status ON smp_calls(status);
CREATE INDEX IF NOT EXISTS idx_smp_calls_called_at ON smp_calls(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_smp_calls_organization ON smp_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_smp_calls_service_type ON smp_calls(service_type);

-- Composite index for cost summary queries
CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_status_date ON smp_calls(smp_provider_id, status, called_at DESC);

-- DOWN Migration
DROP INDEX IF EXISTS idx_smp_calls_provider_status_date;
DROP INDEX IF EXISTS idx_smp_calls_service_type;
DROP INDEX IF EXISTS idx_smp_calls_organization;
DROP INDEX IF EXISTS idx_smp_calls_called_at;
DROP INDEX IF EXISTS idx_smp_calls_status;
DROP INDEX IF EXISTS idx_smp_calls_provider_id;
DROP INDEX IF EXISTS idx_smp_calls_call_id;
DROP INDEX IF EXISTS idx_service_prices_organization;
DROP INDEX IF EXISTS idx_service_prices_type;
DROP INDEX IF EXISTS idx_service_prices_active;
DROP INDEX IF EXISTS idx_smp_providers_organization;
DROP INDEX IF EXISTS idx_smp_providers_active;

DROP TABLE IF EXISTS smp_calls;
DROP TABLE IF EXISTS service_prices;
DROP TABLE IF EXISTS smp_providers;

