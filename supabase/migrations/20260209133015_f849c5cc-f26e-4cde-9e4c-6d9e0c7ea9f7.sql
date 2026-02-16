
-- Fix 1: Make inspection-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'inspection-photos';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view inspection photos" ON storage.objects;

-- Add scoped storage policies for inspection photos
CREATE POLICY "Clerks can view their report photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM inspection_reports ir
    WHERE ir.clerk_id = auth.uid()
  )
);

CREATE POLICY "Clients can view photos for their jobs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM inspection_reports ir
    JOIN jobs j ON j.id = ir.job_id
    WHERE j.client_id = auth.uid()
  )
);

CREATE POLICY "Providers can view photos for their jobs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM inspection_reports ir
    JOIN jobs j ON j.id = ir.job_id
    WHERE j.provider_id = auth.uid()
  )
);

-- Fix 2: Remove overly permissive clerk_invitations SELECT policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON clerk_invitations;

-- Create a secure RPC function to look up invitation by token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  provider_id uuid,
  email text,
  token uuid,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, provider_id, email, token, status, created_at, expires_at, accepted_at
  FROM public.clerk_invitations
  WHERE clerk_invitations.token = _token
    AND clerk_invitations.status = 'pending'
    AND clerk_invitations.expires_at > now()
  LIMIT 1;
$$;
