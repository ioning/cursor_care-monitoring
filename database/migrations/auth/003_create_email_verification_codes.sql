-- UP
-- Migration: Create email_verification_codes table
-- Description: Stores 4-digit verification codes for email confirmation

-- Ensure extensions are enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(4) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_code ON email_verification_codes(email, code);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_codes(expires_at);

-- Cleanup expired codes (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes 
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- DOWN
DROP FUNCTION IF EXISTS cleanup_expired_verification_codes();
DROP INDEX IF EXISTS idx_email_verification_expires;
DROP INDEX IF EXISTS idx_email_verification_code;
DROP INDEX IF EXISTS idx_email_verification_email;
DROP TABLE IF EXISTS email_verification_codes;
