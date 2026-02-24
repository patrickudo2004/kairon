-- Allow anyone to see basic organization info for branding purposes
-- This is needed for TV and Stage views to show logos when accessed anonymously

DROP POLICY IF EXISTS "Organizations are partially viewable by everyone" ON organizations;
CREATE POLICY "Organizations are partially viewable by everyone" 
ON organizations FOR SELECT 
USING (true); -- We can filter specifically to fields in the service layer if needed, but SELECT * is governed by this
