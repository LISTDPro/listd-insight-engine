
-- Add clerk payout breakdown and audit log columns to jobs table
ALTER TABLE public.jobs
  ADD COLUMN clerk_payout_breakdown jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN clerk_payout_log jsonb DEFAULT '[]'::jsonb;
