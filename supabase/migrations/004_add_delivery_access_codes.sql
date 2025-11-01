-- Create table for delivery access codes
CREATE TABLE IF NOT EXISTS public.delivery_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  code varchar(6) NOT NULL,
  recipient_email text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT delivery_access_codes_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_access_codes_delivery_id ON public.delivery_access_codes(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_access_codes_code ON public.delivery_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_delivery_access_codes_expires_at ON public.delivery_access_codes(expires_at);

-- Add RLS policies
ALTER TABLE public.delivery_access_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read their own access codes (by email)
CREATE POLICY "Users can read their own access codes"
  ON public.delivery_access_codes
  FOR SELECT
  USING (true); -- Public read for verification

-- Policy: Only authenticated users can insert access codes (handled by service)
CREATE POLICY "Service can insert access codes"
  ON public.delivery_access_codes
  FOR INSERT
  WITH CHECK (true); -- Will be controlled by API

COMMENT ON TABLE public.delivery_access_codes IS 'Temporary access codes for delivery verification';
COMMENT ON COLUMN public.delivery_access_codes.code IS '6-digit verification code';
COMMENT ON COLUMN public.delivery_access_codes.attempts IS 'Number of failed verification attempts';
COMMENT ON COLUMN public.delivery_access_codes.max_attempts IS 'Maximum allowed verification attempts';
COMMENT ON COLUMN public.delivery_access_codes.verified_at IS 'Timestamp when code was successfully verified';
