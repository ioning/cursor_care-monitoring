-- UP Migration: Add avatar_url to wards table

ALTER TABLE wards 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_wards_avatar_url ON wards(avatar_url) WHERE avatar_url IS NOT NULL;

-- DOWN Migration
DROP INDEX IF EXISTS idx_wards_avatar_url;
ALTER TABLE wards DROP COLUMN IF EXISTS avatar_url;



ALTER TABLE wards 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_wards_avatar_url ON wards(avatar_url) WHERE avatar_url IS NOT NULL;

-- DOWN Migration
DROP INDEX IF EXISTS idx_wards_avatar_url;
ALTER TABLE wards DROP COLUMN IF EXISTS avatar_url;







