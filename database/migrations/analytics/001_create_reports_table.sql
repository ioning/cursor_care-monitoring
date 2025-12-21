-- UP
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Reference to user, but no FK constraint (users table is in different DB)
  report_type VARCHAR(50) NOT NULL,
  filters JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('generating', 'completed', 'failed')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- DOWN
DROP INDEX IF EXISTS idx_reports_type;
DROP INDEX IF EXISTS idx_reports_status;
DROP INDEX IF EXISTS idx_reports_user_id;
DROP TABLE IF EXISTS reports;

