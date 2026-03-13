
CREATE TABLE public.generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid NOT NULL,
  report_url text,
  sent_to_email text,
  sent_at timestamptz
);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all generated reports"
  ON public.generated_reports FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clerks can manage reports for their jobs"
  ON public.generated_reports FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = generated_reports.job_id AND jobs.clerk_id = auth.uid()
  ));

CREATE POLICY "Clients can view reports for their jobs"
  ON public.generated_reports FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = generated_reports.job_id AND jobs.client_id = auth.uid()
  ));
