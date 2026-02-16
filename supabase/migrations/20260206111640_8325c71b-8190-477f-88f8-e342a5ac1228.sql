
-- Add service_tier column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN service_tier text NOT NULL DEFAULT 'standard';

-- Add a check constraint for valid tiers
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_service_tier_check CHECK (service_tier IN ('standard', 'priority', 'premium'));
