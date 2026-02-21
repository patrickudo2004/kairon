-- Phase 6: Add Cue System columns to programs table

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS is_on_hold BOOLEAN DEFAULT false;

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS hold_message TEXT DEFAULT 'WAITING FOR CUE';

-- Update RLS if necessary (usually not needed for just column additions if table RLS is already set)
