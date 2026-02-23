
-- Feature 1: Reschedule request columns on jobs
ALTER TABLE public.jobs
  ADD COLUMN reschedule_requested_date date,
  ADD COLUMN reschedule_requested_time_slot text,
  ADD COLUMN reschedule_requested_at timestamptz,
  ADD COLUMN reschedule_status text,
  ADD COLUMN reschedule_resolved_by uuid,
  ADD COLUMN reschedule_resolved_at timestamptz;

-- Feature 2: Tenant details table
CREATE TABLE public.tenant_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  tenant_order integer NOT NULL DEFAULT 1,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_details ENABLE ROW LEVEL SECURITY;

-- Clients can manage tenant details for their own jobs
CREATE POLICY "Clients can insert tenant details for their jobs"
ON public.tenant_details FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = tenant_details.job_id AND jobs.client_id = auth.uid()
  )
);

CREATE POLICY "Clients can update tenant details for their jobs"
ON public.tenant_details FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = tenant_details.job_id AND jobs.client_id = auth.uid()
  )
);

CREATE POLICY "Clients can view tenant details for their jobs"
ON public.tenant_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = tenant_details.job_id AND jobs.client_id = auth.uid()
  )
);

-- Admins can manage all tenant details
CREATE POLICY "Admins can manage all tenant details"
ON public.tenant_details FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Clerks can view tenant details for their assigned jobs
CREATE POLICY "Clerks can view tenant details for their jobs"
ON public.tenant_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = tenant_details.job_id AND jobs.clerk_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_tenant_details_updated_at
BEFORE UPDATE ON public.tenant_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
