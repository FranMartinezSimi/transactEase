-- Migration: Early Adopter Program
-- Description: Sistema de cuentas free limitadas para early adopters

-- =====================================================
-- 1. ADD early_adopter column to organizations
-- =====================================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_early_adopter BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_adopter_joined_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_organizations_early_adopter ON organizations(is_early_adopter) WHERE is_early_adopter = true;

-- =====================================================
-- 2. CREATE early_adopter_config table
-- =====================================================
CREATE TABLE IF NOT EXISTS early_adopter_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_slots INTEGER NOT NULL DEFAULT 50, -- Máximo de early adopters permitidos
  slots_used INTEGER NOT NULL DEFAULT 0,
  slots_remaining INTEGER GENERATED ALWAYS AS (max_slots - slots_used) STORED,
  program_active BOOLEAN NOT NULL DEFAULT true,
  program_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  program_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint para permitir solo una fila de configuración
CREATE UNIQUE INDEX IF NOT EXISTS single_config_row ON early_adopter_config ((true));

-- Insert default configuration (50 early adopter slots)
INSERT INTO early_adopter_config (max_slots, slots_used)
VALUES (50, 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CREATE function to check early adopter availability
-- =====================================================
CREATE OR REPLACE FUNCTION check_early_adopter_availability()
RETURNS TABLE(
  available BOOLEAN,
  slots_remaining INTEGER,
  program_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER -- Execute with owner's permissions, bypassing RLS
AS $$
DECLARE
  config early_adopter_config;
BEGIN
  -- Get current configuration
  SELECT * INTO config FROM early_adopter_config LIMIT 1;

  -- Return availability status
  RETURN QUERY SELECT
    (config.slots_used < config.max_slots AND config.program_active) AS available,
    (config.max_slots - config.slots_used) AS slots_remaining,
    config.program_active;
END;
$$;

-- =====================================================
-- 4. CREATE function to claim early adopter slot
-- =====================================================
CREATE OR REPLACE FUNCTION claim_early_adopter_slot(org_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  is_early_adopter BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER -- Execute with owner's permissions, bypassing RLS
AS $$
DECLARE
  config early_adopter_config;
  org organizations;
BEGIN
  -- Get current configuration
  SELECT * INTO config FROM early_adopter_config LIMIT 1;

  -- Check if program is active
  IF NOT config.program_active THEN
    RETURN QUERY SELECT false, 'El programa de early adopters ha finalizado', false;
    RETURN;
  END IF;

  -- Check if slots available
  IF config.slots_used >= config.max_slots THEN
    RETURN QUERY SELECT false, 'No quedan slots de early adopter disponibles', false;
    RETURN;
  END IF;

  -- Get organization
  SELECT * INTO org FROM organizations WHERE id = org_id;

  -- Check if organization already is early adopter
  IF org.is_early_adopter THEN
    RETURN QUERY SELECT true, 'Esta organización ya es early adopter', true;
    RETURN;
  END IF;

  -- Claim slot (atomic operation)
  BEGIN
    -- Update organization
    UPDATE organizations
    SET
      is_early_adopter = true,
      early_adopter_joined_at = NOW()
    WHERE id = org_id;

    -- Increment counter
    UPDATE early_adopter_config
    SET
      slots_used = slots_used + 1,
      updated_at = NOW();

    RETURN QUERY SELECT true, 'Slot de early adopter asignado exitosamente', true;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al asignar slot: ' || SQLERRM, false;
  END;
END;
$$;

-- =====================================================
-- 5. CREATE trigger to auto-update slots_used counter
-- =====================================================
-- Trigger para actualizar el contador cuando una organización cambia su estado
CREATE OR REPLACE FUNCTION sync_early_adopter_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambió de false a true, incrementar
  IF (NOT OLD.is_early_adopter) AND NEW.is_early_adopter THEN
    UPDATE early_adopter_config SET slots_used = slots_used + 1;
  END IF;

  -- Si cambió de true a false, decrementar
  IF OLD.is_early_adopter AND (NOT NEW.is_early_adopter) THEN
    UPDATE early_adopter_config SET slots_used = slots_used - 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Solo usaremos la función claim_early_adopter_slot() para evitar race conditions
-- Este trigger es backup por si alguien modifica directamente

-- =====================================================
-- 6. Row Level Security (RLS)
-- =====================================================
ALTER TABLE early_adopter_config ENABLE ROW LEVEL SECURITY;

-- Public read access (to check availability from landing page)
CREATE POLICY "Public read early adopter config"
  ON early_adopter_config
  FOR SELECT
  USING (true);

-- Only service role can update
CREATE POLICY "Service role can update config"
  ON early_adopter_config
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. Comments for documentation
-- =====================================================
COMMENT ON TABLE early_adopter_config IS 'Configuración global del programa de early adopters';
COMMENT ON COLUMN early_adopter_config.max_slots IS 'Número máximo de organizaciones early adopter permitidas';
COMMENT ON COLUMN early_adopter_config.slots_used IS 'Número actual de slots ocupados';
COMMENT ON COLUMN early_adopter_config.program_active IS 'Si false, no se pueden reclamar más slots';

COMMENT ON COLUMN organizations.is_early_adopter IS 'Indica si la organización es early adopter con plan free';
COMMENT ON COLUMN organizations.early_adopter_joined_at IS 'Timestamp de cuando se unió al programa';

COMMENT ON FUNCTION check_early_adopter_availability() IS 'Verifica si quedan slots de early adopter disponibles';
COMMENT ON FUNCTION claim_early_adopter_slot(UUID) IS 'Reclama un slot de early adopter para una organización (operación atómica)';
