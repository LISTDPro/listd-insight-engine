-- Fix: "Users can accept invitations" was created as RESTRICTIVE, blocking clerks from accepting
-- PERMISSIVE is the default and allows any matching row to pass (OR logic between policies)
DROP POLICY IF EXISTS "Users can accept invitations" ON public.clerk_invitations;

CREATE POLICY "Users can accept invitations"
ON public.clerk_invitations
FOR UPDATE
USING ((status = 'pending'::text) AND (expires_at > now()))
WITH CHECK (status = 'accepted'::text);