-- Allow clerks to update jobs assigned to them (for status changes like in_progress)
CREATE POLICY "Clerks can update jobs assigned to them"
ON public.jobs
FOR UPDATE
USING (auth.uid() = clerk_id)
WITH CHECK (auth.uid() = clerk_id);