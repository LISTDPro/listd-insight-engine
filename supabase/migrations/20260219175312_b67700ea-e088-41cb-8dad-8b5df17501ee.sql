-- Add tier acknowledgement timestamp to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS tier_acknowledged_at timestamp with time zone DEFAULT NULL;
