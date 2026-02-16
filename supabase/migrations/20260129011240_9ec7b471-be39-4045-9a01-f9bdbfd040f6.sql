-- Allow clerks to view published jobs directly
CREATE POLICY "Clerks can view published jobs"
ON public.jobs
FOR SELECT
USING (
  status = 'published' AND 
  has_role(auth.uid(), 'clerk')
);

-- Allow clerks to accept published jobs directly (set themselves as clerk_id)
CREATE POLICY "Clerks can accept published jobs"
ON public.jobs
FOR UPDATE
USING (
  status = 'published' AND 
  has_role(auth.uid(), 'clerk')
)
WITH CHECK (
  clerk_id = auth.uid() AND
  status = 'accepted'
);