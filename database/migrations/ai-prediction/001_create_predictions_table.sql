-- UP
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  input_features JSONB NOT NULL,
  output_prediction JSONB NOT NULL,
  confidence DECIMAL(3,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_ward_type ON predictions(ward_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_model_id ON predictions(model_id);

-- DOWN
DROP INDEX IF EXISTS idx_predictions_model_id;
DROP INDEX IF EXISTS idx_predictions_timestamp;
DROP INDEX IF EXISTS idx_predictions_ward_type;
DROP TABLE IF EXISTS predictions;

