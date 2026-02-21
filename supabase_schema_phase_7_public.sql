-- Phase 7: Add Public Portal columns

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Index for fast lookup by slug
CREATE INDEX IF NOT EXISTS idx_programs_slug ON programs(slug);
