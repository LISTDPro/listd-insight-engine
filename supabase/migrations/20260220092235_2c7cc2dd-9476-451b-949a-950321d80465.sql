
-- Add short_notice_surcharge_applied and policy_acknowledged_at to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS short_notice_surcharge_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS policy_acknowledged_at timestamp with time zone;

-- Create clerk_incidents table for reliability tracking
CREATE TABLE IF NOT EXISTS public.clerk_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  incident_type text NOT NULL, -- 'cancellation_24_48h', 'cancellation_lt_24h', 'no_show', 'missed_deadline'
  severity text NOT NULL DEFAULT 'flag', -- 'flag', 'major_flag', 'critical_flag'
  notes text,
  restrict_priority boolean NOT NULL DEFAULT false,
  logged_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clerk_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all clerk incidents"
  ON public.clerk_incidents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clerks can view their own incidents"
  ON public.clerk_incidents FOR SELECT
  USING (auth.uid() = clerk_id);

-- Create waitlist_leads table for Early Access page
CREATE TABLE IF NOT EXISTS public.waitlist_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  company_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL,
  portfolio_size text,
  monthly_volume text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage waitlist leads"
  ON public.waitlist_leads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous inserts for early access form (no auth required)
CREATE POLICY "Anyone can submit waitlist lead"
  ON public.waitlist_leads FOR INSERT
  WITH CHECK (true);
