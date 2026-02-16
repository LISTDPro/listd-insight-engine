-- Add provider_id to profiles for linking clerks to their provider company
ALTER TABLE public.profiles ADD COLUMN provider_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_provider_id ON public.profiles(provider_id);

-- Allow providers to view published jobs (available to accept)
CREATE POLICY "Providers can view published jobs"
  ON public.jobs FOR SELECT
  USING (status = 'published' AND public.has_role(auth.uid(), 'provider'));

-- Allow providers to update jobs they're assigned to (for accepting and assigning clerks)
CREATE POLICY "Providers can update jobs assigned to them"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Allow providers to accept published jobs (update provider_id on published jobs)
CREATE POLICY "Providers can accept published jobs"
  ON public.jobs FOR UPDATE
  USING (status = 'published' AND public.has_role(auth.uid(), 'provider'))
  WITH CHECK (provider_id = auth.uid());

-- Allow providers to view profiles of clerks under their company
CREATE POLICY "Providers can view their clerks profiles"
  ON public.profiles FOR SELECT
  USING (provider_id = auth.uid());

-- Allow providers to update their clerks profiles (for linking)
CREATE POLICY "Providers can update their clerks profiles"
  ON public.profiles FOR UPDATE
  USING (provider_id = auth.uid());