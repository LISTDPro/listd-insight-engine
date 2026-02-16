-- Add column to track Terms of Business Agreement acknowledgement for clients
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.terms_agreed_at IS 'Timestamp when client agreed to Terms of Business Agreement';