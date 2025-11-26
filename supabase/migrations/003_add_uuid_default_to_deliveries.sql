-- Add DEFAULT gen_random_uuid() to deliveries.id column
ALTER TABLE public.deliveries
ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.deliveries.id IS 'Primary key with automatic UUID generation';
