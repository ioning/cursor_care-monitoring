-- UP
CREATE TABLE IF NOT EXISTS dispatchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  active_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatchers_available ON dispatchers(available);
CREATE INDEX IF NOT EXISTS idx_dispatchers_user_id ON dispatchers(user_id);

-- DOWN
DROP INDEX IF EXISTS idx_dispatchers_user_id;
DROP INDEX IF EXISTS idx_dispatchers_available;
DROP TABLE IF EXISTS dispatchers;

