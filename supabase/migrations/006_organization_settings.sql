-- Migration: Organization-Centric Settings
-- Description: Centraliza toda la configuración en la organización

-- =====================================================
-- 1. CREATE organization_settings table
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- ===== DELIVERY DEFAULTS =====
  -- Valores por defecto cuando se crea una delivery
  default_max_views INTEGER NOT NULL DEFAULT 10,
  default_max_downloads INTEGER NOT NULL DEFAULT 5,
  default_expiration_hours INTEGER NOT NULL DEFAULT 24,
  default_require_authentication BOOLEAN NOT NULL DEFAULT true,

  -- ===== DELIVERY LIMITS =====
  -- Límites máximos que puede configurar un usuario
  max_views_limit INTEGER NOT NULL DEFAULT 1000,
  max_downloads_limit INTEGER NOT NULL DEFAULT 100,
  max_expiration_hours_limit INTEGER NOT NULL DEFAULT 720, -- 30 días
  min_expiration_hours_limit INTEGER NOT NULL DEFAULT 1,

  -- ===== FILE RESTRICTIONS =====
  max_file_size_bytes BIGINT NOT NULL DEFAULT 314572800, -- 300MB
  allowed_mime_types TEXT[] DEFAULT ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'text/csv'
  ],
  blocked_file_extensions TEXT[] DEFAULT ARRAY['.exe', '.bat', '.sh', '.cmd'],

  -- ===== AI COMPLIANCE SETTINGS =====
  ai_compliance_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_provider VARCHAR(50) DEFAULT 'gemini', -- 'gemini' | 'openai' | 'claude'
  ai_scan_pii BOOLEAN NOT NULL DEFAULT true,
  ai_scan_phi BOOLEAN NOT NULL DEFAULT true,
  ai_scan_financial BOOLEAN NOT NULL DEFAULT true,
  ai_scan_code_secrets BOOLEAN NOT NULL DEFAULT true,
  ai_scan_images_ocr BOOLEAN NOT NULL DEFAULT false, -- More expensive
  ai_regulations TEXT[] DEFAULT ARRAY['GDPR', 'HIPAA', 'CCPA'],
  ai_block_on_critical BOOLEAN NOT NULL DEFAULT false,
  ai_alert_on_high BOOLEAN NOT NULL DEFAULT true,
  ai_alert_on_medium BOOLEAN NOT NULL DEFAULT false,
  ai_max_scans_per_month INTEGER DEFAULT NULL, -- NULL = unlimited
  ai_scan_timeout_seconds INTEGER NOT NULL DEFAULT 30,

  -- ===== SECURITY FEATURES =====
  allow_password_protection BOOLEAN NOT NULL DEFAULT true,
  require_recipient_verification BOOLEAN NOT NULL DEFAULT true,
  allow_anonymous_delivery BOOLEAN NOT NULL DEFAULT false,
  require_access_code BOOLEAN NOT NULL DEFAULT true,
  access_code_expiration_minutes INTEGER NOT NULL DEFAULT 15,
  max_access_code_attempts INTEGER NOT NULL DEFAULT 3,

  -- ===== ACCESS CONTROL =====
  enable_email_whitelist BOOLEAN NOT NULL DEFAULT false,
  enable_email_blacklist BOOLEAN NOT NULL DEFAULT false,
  enable_ip_whitelist BOOLEAN NOT NULL DEFAULT false,
  enable_ip_blacklist BOOLEAN NOT NULL DEFAULT false,
  enable_domain_restriction BOOLEAN NOT NULL DEFAULT false,

  -- ===== AUDIT & COMPLIANCE =====
  enable_audit_trail BOOLEAN NOT NULL DEFAULT true,
  enable_digital_signatures BOOLEAN NOT NULL DEFAULT false,
  enable_custody_chain BOOLEAN NOT NULL DEFAULT false,
  retention_policy_days INTEGER DEFAULT NULL, -- NULL = indefinite
  auto_delete_on_expiration BOOLEAN NOT NULL DEFAULT true,

  -- ===== NOTIFICATIONS =====
  notify_on_delivery_view BOOLEAN NOT NULL DEFAULT false,
  notify_on_delivery_download BOOLEAN NOT NULL DEFAULT true,
  notify_on_delivery_expired BOOLEAN NOT NULL DEFAULT false,
  notify_on_high_risk_content BOOLEAN NOT NULL DEFAULT true,
  notify_on_access_denied BOOLEAN NOT NULL DEFAULT true,

  -- ===== METADATA =====
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),

  -- Ensure one settings per organization
  CONSTRAINT unique_org_settings UNIQUE(organization_id)
);

-- =====================================================
-- 2. CREATE indexes
-- =====================================================
CREATE INDEX idx_org_settings_org_id ON organization_settings(organization_id);
CREATE INDEX idx_org_settings_ai_enabled ON organization_settings(ai_compliance_enabled);

-- =====================================================
-- 3. CREATE trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_organization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_settings_updated_at();

-- =====================================================
-- 4. CREATE default settings for existing organizations
-- =====================================================
INSERT INTO organization_settings (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- 5. DEPRECATE old columns in organizations table
-- =====================================================
-- We'll keep them for backwards compatibility but they're no longer used
COMMENT ON COLUMN organizations.max_views IS 'DEPRECATED: Use organization_settings.max_views_limit';
COMMENT ON COLUMN organizations.max_downloads IS 'DEPRECATED: Use organization_settings.max_downloads_limit';
COMMENT ON COLUMN organizations.max_expiration_hours IS 'DEPRECATED: Use organization_settings.max_expiration_hours_limit';
COMMENT ON COLUMN organizations.min_expiration_hours IS 'DEPRECATED: Use organization_settings.min_expiration_hours_limit';

-- =====================================================
-- 6. Row Level Security (RLS)
-- =====================================================
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Admins and owners can read their org settings
CREATE POLICY "Users can read their organization settings"
  ON organization_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Only owners and admins can update settings
CREATE POLICY "Admins can update organization settings"
  ON organization_settings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT p.organization_id
      FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role full access"
  ON organization_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. Helper function to get organization settings
-- =====================================================
CREATE OR REPLACE FUNCTION get_organization_settings(org_id UUID)
RETURNS organization_settings AS $$
  SELECT * FROM organization_settings WHERE organization_id = org_id LIMIT 1;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- 8. Validation function for delivery creation
-- =====================================================
CREATE OR REPLACE FUNCTION validate_delivery_limits(
  org_id UUID,
  requested_max_views INTEGER,
  requested_max_downloads INTEGER,
  requested_expiration_hours INTEGER
)
RETURNS TABLE(valid BOOLEAN, error_message TEXT) AS $$
DECLARE
  settings organization_settings;
BEGIN
  -- Get organization settings
  SELECT * INTO settings FROM organization_settings WHERE organization_id = org_id;

  -- Validate max views
  IF requested_max_views > settings.max_views_limit THEN
    RETURN QUERY SELECT false,
      'Max views exceeds organization limit of ' || settings.max_views_limit;
  END IF;

  -- Validate max downloads
  IF requested_max_downloads > settings.max_downloads_limit THEN
    RETURN QUERY SELECT false,
      'Max downloads exceeds organization limit of ' || settings.max_downloads_limit;
  END IF;

  -- Validate expiration hours
  IF requested_expiration_hours > settings.max_expiration_hours_limit THEN
    RETURN QUERY SELECT false,
      'Expiration exceeds organization limit of ' || settings.max_expiration_hours_limit || ' hours';
  END IF;

  IF requested_expiration_hours < settings.min_expiration_hours_limit THEN
    RETURN QUERY SELECT false,
      'Expiration below organization minimum of ' || settings.min_expiration_hours_limit || ' hours';
  END IF;

  -- All validations passed
  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 9. Comments for documentation
-- =====================================================
COMMENT ON TABLE organization_settings IS 'Centralized configuration for organization-level delivery and compliance settings';
COMMENT ON COLUMN organization_settings.default_max_views IS 'Default max views when creating a new delivery';
COMMENT ON COLUMN organization_settings.max_views_limit IS 'Maximum max_views a user can set (hard limit)';
COMMENT ON COLUMN organization_settings.ai_compliance_enabled IS 'Enable AI-powered compliance scanning for this organization';
COMMENT ON COLUMN organization_settings.ai_provider IS 'AI provider: gemini (free), openai (paid), claude (premium)';
COMMENT ON COLUMN organization_settings.ai_block_on_critical IS 'Automatically block delivery if critical risk detected';
COMMENT ON COLUMN organization_settings.ai_max_scans_per_month IS 'Monthly limit for AI scans (NULL = unlimited)';
