-- RLS policies for delivery_access_codes table
-- Allow anyone (including anonymous users) to insert and select access codes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create access codes" ON public.delivery_access_codes;
DROP POLICY IF EXISTS "Anyone can read access codes" ON public.delivery_access_codes;
DROP POLICY IF EXISTS "Anyone can update access codes" ON public.delivery_access_codes;

-- Enable RLS on the table
ALTER TABLE public.delivery_access_codes ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert access codes
CREATE POLICY "Anyone can create access codes"
  ON public.delivery_access_codes
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow anyone to read access codes (needed for verification)
CREATE POLICY "Anyone can read access codes"
  ON public.delivery_access_codes
  FOR SELECT
  USING (true);

-- Policy to allow anyone to update access codes (needed for incrementing attempts and marking as verified)
CREATE POLICY "Anyone can update access codes"
  ON public.delivery_access_codes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT SELECT, INSERT, UPDATE ON public.delivery_access_codes TO anon;
GRANT SELECT, INSERT, UPDATE ON public.delivery_access_codes TO authenticated;

-- Add comments
COMMENT ON POLICY "Anyone can create access codes" ON public.delivery_access_codes
IS 'Allow public access to create access codes. Security is handled at application level through delivery validation.';

COMMENT ON POLICY "Anyone can read access codes" ON public.delivery_access_codes
IS 'Allow public access to read access codes for verification. Codes are single-use and expire after 15 minutes.';

COMMENT ON POLICY "Anyone can update access codes" ON public.delivery_access_codes
IS 'Allow public access to update access codes for attempt tracking and verification marking.';
