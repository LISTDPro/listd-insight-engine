
-- Add clerk payout fields to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS clerk_payout numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clerk_bonus numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clerk_final_payout numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clerk_payout_locked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS clerk_payment_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS clerk_level_at_job integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS margin numeric DEFAULT 0;
