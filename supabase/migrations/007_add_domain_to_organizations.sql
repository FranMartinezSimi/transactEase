-- Add domain field to organizations table for domain-based SSO auto-assignment
-- When a user logs in via SSO, their email domain will be matched against organization domains
-- to automatically assign them to the correct organization

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add comment explaining the domain field
COMMENT ON COLUMN organizations.domain IS 'Email domain for organization (e.g., "company.com"). Used for SSO auto-assignment - users with matching email domains are automatically added to this organization when they log in.';

-- Create index for faster domain lookups during SSO login
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
