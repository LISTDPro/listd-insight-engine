
-- Fix 1: Xero tokens exposure - create safe RPC function and drop permissive SELECT policies
CREATE OR REPLACE FUNCTION public.get_user_xero_connection()
RETURNS TABLE (
  tenant_name TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_name, token_expires_at, connected_at
  FROM xero_connections
  WHERE user_id = auth.uid()
  ORDER BY connected_at DESC
  LIMIT 1;
$$;

-- Drop the user SELECT policy that exposes tokens
DROP POLICY IF EXISTS "Users can view their own xero connections" ON public.xero_connections;

-- Drop admin SELECT policy too (admins should use service role)
DROP POLICY IF EXISTS "Admins can view all xero connections" ON public.xero_connections;

-- Fix 2: Unrestricted notification insert - replace permissive policy
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only admins can insert notifications via client; edge functions use service role
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
