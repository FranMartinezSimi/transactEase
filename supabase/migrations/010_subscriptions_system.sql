-- Migration: Subscriptions and Pricing System
-- Description: Sistema de suscripciones con planes y límites enforced

-- =====================================================
-- 1. CREATE subscriptions table
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Plan info
  plan TEXT NOT NULL CHECK (plan IN ('early_adopter', 'starter', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trial')) DEFAULT 'trial',

  -- Limits (per month)
  deliveries_limit INTEGER NOT NULL,
  storage_limit_gb INTEGER NOT NULL,
  users_limit INTEGER NOT NULL,
  max_file_size_mb INTEGER NOT NULL DEFAULT 300,

  -- Features
  ai_compliance_enabled BOOLEAN NOT NULL DEFAULT false,
  custom_branding BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  api_access BOOLEAN NOT NULL DEFAULT false,

  -- Billing (for future Stripe integration)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index
  CONSTRAINT unique_org_subscription UNIQUE(organization_id)
);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- 2. CREATE subscription_usage table (track monthly usage)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  -- Usage counters
  deliveries_count INTEGER NOT NULL DEFAULT 0,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  users_count INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: one record per org per month
  CONSTRAINT unique_org_period UNIQUE(organization_id, year, month)
);

CREATE INDEX idx_usage_org_period ON subscription_usage(organization_id, year, month);

-- =====================================================
-- 3. FUNCTION: Auto-create subscription when organization is created
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_type TEXT;
  deliveries_limit INTEGER;
  storage_limit INTEGER;
  users_limit INTEGER;
  ai_enabled BOOLEAN;
BEGIN
  -- Determine plan based on early_adopter status
  IF NEW.is_early_adopter = true THEN
    plan_type := 'early_adopter';
    deliveries_limit := 5;
    storage_limit := 1;
    users_limit := 1;
    ai_enabled := false;
  ELSE
    plan_type := 'starter';
    deliveries_limit := 50;
    storage_limit := 10;
    users_limit := 5;
    ai_enabled := false;
  END IF;

  -- Create subscription
  INSERT INTO subscriptions (
    organization_id,
    plan,
    status,
    deliveries_limit,
    storage_limit_gb,
    users_limit,
    ai_compliance_enabled
  ) VALUES (
    NEW.id,
    plan_type,
    'active',
    deliveries_limit,
    storage_limit,
    users_limit,
    ai_enabled
  ) ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to auto-create subscription
DROP TRIGGER IF EXISTS trigger_create_subscription ON organizations;
CREATE TRIGGER trigger_create_subscription
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- =====================================================
-- 4. FUNCTION: Check if organization can create delivery
-- =====================================================
CREATE OR REPLACE FUNCTION can_create_delivery(org_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  deliveries_used INTEGER,
  deliveries_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub subscriptions;
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  usage_count INTEGER;
BEGIN
  -- Get subscription
  SELECT * INTO sub FROM subscriptions WHERE organization_id = org_id LIMIT 1;

  IF sub IS NULL THEN
    RETURN QUERY SELECT false, 'No subscription found', 0, 0;
    RETURN;
  END IF;

  -- Check subscription status
  IF sub.status != 'active' THEN
    RETURN QUERY SELECT false, 'Subscription is not active', 0, sub.deliveries_limit;
    RETURN;
  END IF;

  -- Get current month usage
  SELECT COALESCE(deliveries_count, 0) INTO usage_count
  FROM subscription_usage
  WHERE organization_id = org_id
    AND year = current_year
    AND month = current_month;

  IF usage_count IS NULL THEN
    usage_count := 0;
  END IF;

  -- Check limit
  IF usage_count >= sub.deliveries_limit THEN
    RETURN QUERY SELECT
      false,
      'Monthly delivery limit reached. Upgrade your plan to continue.',
      usage_count,
      sub.deliveries_limit;
    RETURN;
  END IF;

  -- All good
  RETURN QUERY SELECT true, 'OK', usage_count, sub.deliveries_limit;
END;
$$;

-- =====================================================
-- 5. FUNCTION: Increment delivery counter
-- =====================================================
CREATE OR REPLACE FUNCTION increment_delivery_usage(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
  -- Upsert usage record
  INSERT INTO subscription_usage (organization_id, year, month, deliveries_count)
  VALUES (org_id, current_year, current_month, 1)
  ON CONFLICT (organization_id, year, month)
  DO UPDATE SET
    deliveries_count = subscription_usage.deliveries_count + 1,
    updated_at = NOW();
END;
$$;

-- =====================================================
-- 6. FUNCTION: Get subscription with usage stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_subscription_info(org_id UUID)
RETURNS TABLE(
  plan TEXT,
  status TEXT,
  deliveries_limit INTEGER,
  storage_limit_gb INTEGER,
  users_limit INTEGER,
  ai_compliance_enabled BOOLEAN,
  deliveries_used INTEGER,
  storage_used_gb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
  RETURN QUERY
  SELECT
    s.plan,
    s.status,
    s.deliveries_limit,
    s.storage_limit_gb,
    s.users_limit,
    s.ai_compliance_enabled,
    COALESCE(u.deliveries_count, 0) AS deliveries_used,
    ROUND(COALESCE(u.storage_used_bytes, 0)::NUMERIC / 1073741824, 2) AS storage_used_gb
  FROM subscriptions s
  LEFT JOIN subscription_usage u ON (
    u.organization_id = s.organization_id
    AND u.year = current_year
    AND u.month = current_month
  )
  WHERE s.organization_id = org_id;
END;
$$;

-- =====================================================
-- 7. Row Level Security (RLS)
-- =====================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own organization's subscription
CREATE POLICY "Users read own org subscription"
  ON subscriptions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can update their org subscription
CREATE POLICY "Admins update org subscription"
  ON subscriptions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Users can read their own org usage
CREATE POLICY "Users read own org usage"
  ON subscription_usage
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service full access subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service full access usage"
  ON subscription_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 8. Comments for documentation
-- =====================================================
COMMENT ON TABLE subscriptions IS 'Suscripciones y planes de organizaciones';
COMMENT ON TABLE subscription_usage IS 'Tracking de uso mensual por organización';

COMMENT ON FUNCTION can_create_delivery(UUID) IS 'Verifica si una organización puede crear un delivery basado en su plan';
COMMENT ON FUNCTION increment_delivery_usage(UUID) IS 'Incrementa el contador de deliveries para el mes actual';
COMMENT ON FUNCTION get_subscription_info(UUID) IS 'Obtiene información completa de suscripción y uso';

-- =====================================================
-- 9. Migrate existing organizations to have subscriptions
-- =====================================================
-- This will trigger the auto-create function for existing orgs
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id, is_early_adopter FROM organizations LOOP
    -- Manually insert subscriptions for existing orgs
    PERFORM create_default_subscription() FROM organizations WHERE id = org_record.id;
  END LOOP;
END $$;
