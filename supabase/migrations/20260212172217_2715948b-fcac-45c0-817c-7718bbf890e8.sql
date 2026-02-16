
-- =============================================
-- 1. Escrow Payments Table (Stripe-ready architecture)
-- =============================================
CREATE TABLE public.escrow_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  client_id uuid NOT NULL,
  clerk_id uuid,
  provider_id uuid,
  gross_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  provider_fee numeric NOT NULL DEFAULT 0,
  clerk_payout numeric NOT NULL DEFAULT 0,
  cancellation_fee numeric DEFAULT 0,
  cancellation_reason text,
  cancelled_by uuid,
  status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  stripe_refund_id text,
  held_at timestamptz,
  auto_release_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own escrow payments"
  ON public.escrow_payments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clerks can view their own escrow payments"
  ON public.escrow_payments FOR SELECT USING (auth.uid() = clerk_id);
CREATE POLICY "Providers can view their own escrow payments"
  ON public.escrow_payments FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Admins can view all escrow payments"
  ON public.escrow_payments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert escrow payments"
  ON public.escrow_payments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update their escrow payments"
  ON public.escrow_payments FOR UPDATE USING (auth.uid() = client_id);

CREATE TRIGGER update_escrow_payments_updated_at
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Clerk Progression columns on profiles
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS clerk_rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clerk_jobs_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS non_circumvention_agreed_at timestamptz;

-- =============================================
-- 3. Cancellation tracking on jobs
-- =============================================
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancellation_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
