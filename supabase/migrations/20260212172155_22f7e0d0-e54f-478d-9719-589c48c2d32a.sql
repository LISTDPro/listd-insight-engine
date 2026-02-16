
-- Drop the old check constraint on service_tier
ALTER TABLE public.jobs DROP CONSTRAINT jobs_service_tier_check;

-- Update existing service_tier values: standard→flex, priority→core, premium→priority
UPDATE public.jobs SET service_tier = 'flex' WHERE service_tier = 'standard';
UPDATE public.jobs SET service_tier = '_core_temp' WHERE service_tier = 'priority';
UPDATE public.jobs SET service_tier = 'priority' WHERE service_tier = 'premium';
UPDATE public.jobs SET service_tier = 'core' WHERE service_tier = '_core_temp';

-- Add new check constraint with updated tier names
ALTER TABLE public.jobs ADD CONSTRAINT jobs_service_tier_check 
  CHECK (service_tier = ANY (ARRAY['flex'::text, 'core'::text, 'priority'::text]));

-- Update default
ALTER TABLE public.jobs ALTER COLUMN service_tier SET DEFAULT 'flex';
