-- Phase 3: Monetization & Branding

-- Add branding and subscription columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_color TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add cost analytics columns to programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS estimated_attendees INTEGER DEFAULT 0;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS average_hourly_rate DECIMAL DEFAULT 0;
