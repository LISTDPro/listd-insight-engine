
-- Add signature columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN client_signature_url text,
ADD COLUMN client_signature_at timestamp with time zone;
