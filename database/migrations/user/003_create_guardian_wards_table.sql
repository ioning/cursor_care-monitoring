-- UP
CREATE TABLE IF NOT EXISTS guardian_wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL,
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'ward',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guardian_id, ward_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_wards_guardian ON guardian_wards(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_wards_ward ON guardian_wards(ward_id);

-- DOWN
DROP INDEX IF EXISTS idx_guardian_wards_ward;
DROP INDEX IF EXISTS idx_guardian_wards_guardian;
DROP TABLE IF EXISTS guardian_wards;

