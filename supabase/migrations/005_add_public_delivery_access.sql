-- Allow public read access to deliveries for recipients
-- This is needed so recipients can view deliveries via the public link

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public users can view deliveries" ON public.deliveries;

-- Create policy for public read access
CREATE POLICY "Public users can view deliveries"
  ON public.deliveries
  FOR SELECT
  USING (true);

-- Allow public read access to delivery_files for recipients
DROP POLICY IF EXISTS "Public users can view delivery files" ON public.delivery_files;

CREATE POLICY "Public users can view delivery files"
  ON public.delivery_files
  FOR SELECT
  USING (true);

COMMENT ON POLICY "Public users can view deliveries" ON public.deliveries
IS 'Allow public access to deliveries for recipients. Access control is handled at the application level via email verification and access codes.';

COMMENT ON POLICY "Public users can view delivery files" ON public.delivery_files
IS 'Allow public access to delivery files. Access control is handled at the application level.';
