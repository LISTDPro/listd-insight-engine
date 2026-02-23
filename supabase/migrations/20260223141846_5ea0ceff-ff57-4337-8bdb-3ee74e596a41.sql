
-- Create property_change_logs table for audit trail
CREATE TABLE public.property_change_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL,
  changes jsonb NOT NULL,
  may_affect_pricing boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_change_logs ENABLE ROW LEVEL SECURITY;

-- Clients can insert logs for their own properties
CREATE POLICY "Clients can insert change logs for their properties"
ON public.property_change_logs
FOR INSERT
WITH CHECK (
  auth.uid() = changed_by
  AND EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_change_logs.property_id
    AND properties.client_id = auth.uid()
  )
);

-- Clients can view logs for their own properties
CREATE POLICY "Clients can view change logs for their properties"
ON public.property_change_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_change_logs.property_id
    AND properties.client_id = auth.uid()
  )
);

-- Admins can view all logs
CREATE POLICY "Admins can view all change logs"
ON public.property_change_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Clerks can view logs for properties linked to their jobs
CREATE POLICY "Clerks can view change logs for their job properties"
ON public.property_change_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.property_id = property_change_logs.property_id
    AND jobs.clerk_id = auth.uid()
  )
);

-- Add index for faster lookups
CREATE INDEX idx_property_change_logs_property_id ON public.property_change_logs(property_id);
CREATE INDEX idx_property_change_logs_created_at ON public.property_change_logs(created_at);
