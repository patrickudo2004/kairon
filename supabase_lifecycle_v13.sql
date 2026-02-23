-- Add status column to programs table
ALTER TABLE programs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'concluded'));

-- Update existing programs to 'draft' if they don't have a status
UPDATE programs SET status = 'draft' WHERE status IS NULL;
