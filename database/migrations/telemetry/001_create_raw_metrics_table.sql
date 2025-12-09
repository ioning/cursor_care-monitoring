-- UP
CREATE TABLE IF NOT EXISTS raw_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  ward_id UUID NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  unit VARCHAR(20),
  quality_score DECIMAL(3,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_metrics_ward_timestamp ON raw_metrics(ward_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_raw_metrics_device_timestamp ON raw_metrics(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_raw_metrics_type ON raw_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_raw_metrics_timestamp ON raw_metrics(timestamp DESC);

-- Partitioning by month (optional, for large datasets)
-- CREATE TABLE raw_metrics_2024_01 PARTITION OF raw_metrics
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- DOWN
DROP INDEX IF EXISTS idx_raw_metrics_timestamp;
DROP INDEX IF EXISTS idx_raw_metrics_type;
DROP INDEX IF EXISTS idx_raw_metrics_device_timestamp;
DROP INDEX IF EXISTS idx_raw_metrics_ward_timestamp;
DROP TABLE IF EXISTS raw_metrics;

