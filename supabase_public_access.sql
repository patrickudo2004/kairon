-- Allow Anonymous (unauthenticated) access to public programs
-- This allows anyone with a link to /p/slug to view the schedule

-- 1. Programs: Allow anyone to select public programs
DROP POLICY IF EXISTS "Public programs are viewable by everyone" ON programs;
CREATE POLICY "Public programs are viewable by everyone" 
ON programs FOR SELECT 
USING (is_public = true);

-- 2. Slots: Allow anyone to select slots belonging to public programs
DROP POLICY IF EXISTS "Slots are viewable if program is public" ON slots;
CREATE POLICY "Slots are viewable if program is public" 
ON slots FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = slots.program_id 
    AND programs.is_public = true
  )
);
