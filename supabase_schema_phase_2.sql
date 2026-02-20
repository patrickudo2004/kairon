-- Add manual_mode column to programs table
ALTER TABLE programs ADD COLUMN IF NOT EXISTS manual_mode BOOLEAN DEFAULT FALSE;

-- Update the get_programs view or policies if necessary (usually not needed for simple column addition)
-- But let's ensure the prompter logic is documented here too as part of Phase 1 feedback
-- Phase 2 also tracks actual_duration in slots, which exists, but we'll ensure the UI uses it.
