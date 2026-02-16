
-- Create email_logs table for tracking all sent emails/notifications
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  resend_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions insert via service role, so no INSERT policy needed for regular users
-- But we add one for service role inserts (service role bypasses RLS anyway)

-- Index for faster lookups
CREATE INDEX idx_email_logs_created_at ON public.email_logs (created_at DESC);
CREATE INDEX idx_email_logs_function_name ON public.email_logs (function_name);
CREATE INDEX idx_email_logs_status ON public.email_logs (status);
