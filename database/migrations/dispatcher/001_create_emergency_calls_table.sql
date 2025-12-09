-- UP
CREATE TABLE IF NOT EXISTS emergency_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL,
  call_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'in_progress', 'resolved', 'canceled')),
  dispatcher_id UUID,
  source VARCHAR(50) NOT NULL,
  health_snapshot JSONB,
  location_snapshot JSONB,
  ai_analysis JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_calls_ward_id ON emergency_calls(ward_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON emergency_calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_priority ON emergency_calls(priority);
CREATE INDEX IF NOT EXISTS idx_calls_dispatcher_id ON emergency_calls(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON emergency_calls(created_at DESC);

-- DOWN
DROP INDEX IF EXISTS idx_calls_created_at;
DROP INDEX IF EXISTS idx_calls_dispatcher_id;
DROP INDEX IF EXISTS idx_calls_priority;
DROP INDEX IF EXISTS idx_calls_status;
DROP INDEX IF EXISTS idx_calls_ward_id;
DROP TABLE IF EXISTS emergency_calls;

