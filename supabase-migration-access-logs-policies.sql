-- Migration: Add RLS policies for access_logs table
-- This allows the application to insert and read audit logs

-- Enable Row Level Security on access_logs
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for API routes using server-side Supabase client)
CREATE POLICY "Service role can do everything on access_logs"
ON public.access_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow anonymous users to INSERT logs (for public delivery access tracking)
-- This is necessary because recipients accessing deliveries are not authenticated
CREATE POLICY "Allow anonymous insert on access_logs"
ON public.access_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow authenticated users to INSERT logs
CREATE POLICY "Allow authenticated insert on access_logs"
ON public.access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to SELECT their own organization's logs
CREATE POLICY "Users can view their organization's access logs"
ON public.access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.deliveries d
    INNER JOIN public.profiles p ON p.id = d.sender_id
    WHERE d.id = access_logs.delivery_id
    AND p.organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- Policy: Allow admins/owners to view all logs in their organization
CREATE POLICY "Admins can view all organization access logs"
ON public.access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'owner')
    AND p.organization_id IN (
      SELECT p2.organization_id
      FROM public.deliveries d
      INNER JOIN public.profiles p2 ON p2.id = d.sender_id
      WHERE d.id = access_logs.delivery_id
    )
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.access_logs TO authenticated;
GRANT SELECT, INSERT ON public.access_logs TO anon;
GRANT ALL ON public.access_logs TO service_role;
