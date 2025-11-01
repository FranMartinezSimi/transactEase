-- Add hash column to delivery_files table for SHA-256 integrity verification
ALTER TABLE public.delivery_files
ADD COLUMN IF NOT EXISTS hash text;

COMMENT ON COLUMN public.delivery_files.hash IS 'SHA-256 hash of the file content for integrity verification';

