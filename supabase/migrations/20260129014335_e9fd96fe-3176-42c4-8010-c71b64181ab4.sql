-- Allow clerks to view properties for jobs assigned to them or published jobs they can accept
CREATE POLICY "Clerks can view properties for their jobs"
ON public.properties
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.property_id = properties.id
    AND (
      jobs.clerk_id = auth.uid()
      OR (jobs.status = 'published' AND has_role(auth.uid(), 'clerk'))
    )
  )
);

-- Enable realtime for jobs table so clerks get live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;