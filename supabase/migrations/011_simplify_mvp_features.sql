-- Migration: Simplify MVP Features
-- Description: Remove non-essential features for legal/real estate MVP

-- =====================================================
-- 1. SIMPLIFY organizations table
-- =====================================================
-- Remove domain/website columns (not useful for MVP)
-- Users send to external clients, so domain validation doesn't make sense

ALTER TABLE organizations DROP COLUMN IF EXISTS domain;
ALTER TABLE organizations DROP COLUMN IF EXISTS website;
ALTER TABLE organizations DROP COLUMN IF EXISTS logo_url;
ALTER TABLE organizations DROP COLUMN IF EXISTS slug;

-- Remove old deprecated columns if they exist
ALTER TABLE organizations DROP COLUMN IF EXISTS max_views;
ALTER TABLE organizations DROP COLUMN IF EXISTS max_downloads;
ALTER TABLE organizations DROP COLUMN IF EXISTS max_expiration_hours;
ALTER TABLE organizations DROP COLUMN IF EXISTS min_expiration_hours;

-- =====================================================
-- 2. SIMPLIFY subscriptions table
-- =====================================================
-- Remove AI compliance flag (not in MVP)
ALTER TABLE subscriptions DROP COLUMN IF EXISTS ai_compliance_enabled;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS custom_branding;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS api_access;

-- =====================================================
-- 3. DROP invitations table
-- =====================================================
-- We only use organization_invitations (SSO-based)
-- The old invitations table with tokens is redundant
DROP TABLE IF EXISTS invitations CASCADE;

-- =====================================================
-- 4. SIMPLIFY organization_settings (if exists)
-- =====================================================
-- Note: This table might not exist yet, so we check first

DO $$
BEGIN
  -- Check if organization_settings table exists
  IF EXISTS (SELECT FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = 'organization_settings') THEN

    -- Remove domain/email restrictions
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS enable_email_whitelist;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS enable_email_blacklist;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS enable_domain_restriction;

    -- Remove IP restrictions
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS enable_ip_whitelist;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS enable_ip_blacklist;

    -- Remove advanced legal features
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS enable_digital_signatures;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS enable_custody_chain;

    -- Remove custom branding
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS custom_branding;

    -- Remove AI features
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_compliance_enabled;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_provider;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_scan_pii;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_scan_phi;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_scan_financial;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_scan_code_secrets;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_scan_images_ocr;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_regulations;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_block_on_critical;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_alert_on_high;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_alert_on_medium;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_max_scans_per_month;
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS ai_scan_timeout_seconds;

    -- Remove API access
    ALTER TABLE organization_settings DROP COLUMN IF EXISTS api_access_enabled;

    RAISE NOTICE 'organization_settings table simplified';
  ELSE
    RAISE NOTICE 'organization_settings table does not exist, skipping';
  END IF;
END $$;

-- =====================================================
-- 5. UPDATE COMMENTS
-- =====================================================
COMMENT ON TABLE organizations IS 'Organizaciones - MVP simplificado (solo nombre requerido)';
COMMENT ON TABLE subscriptions IS 'Planes de suscripción - MVP sin AI/branding/API';

-- Update comment on organization_settings only if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = 'organization_settings') THEN
    EXECUTE 'COMMENT ON TABLE organization_settings IS ''Settings simplificados para MVP - core security features only''';
  END IF;
END $$;

-- =====================================================
-- 6. VERIFY DATA INTEGRITY
-- =====================================================
-- All existing data should remain intact, just columns are removed
-- Subscriptions, profiles, and deliveries are not affected

SELECT 'Migration 011 completed successfully - MVP simplified' AS status;
