-- UP
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ward_id UUID,
  name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  firmware_version VARCHAR(50),
  mac_address VARCHAR(17),
  serial_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_ward_id ON devices(ward_id);
CREATE INDEX IF NOT EXISTS idx_devices_api_key ON devices(api_key);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- DOWN
DROP INDEX IF EXISTS idx_devices_status;
DROP INDEX IF EXISTS idx_devices_api_key;
DROP INDEX IF EXISTS idx_devices_ward_id;
DROP INDEX IF EXISTS idx_devices_user_id;
DROP TABLE IF EXISTS devices;

