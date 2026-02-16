-- Create clerk_invitations table
CREATE TABLE public.clerk_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  UNIQUE (provider_id, email, status)
);

-- Enable RLS
ALTER TABLE public.clerk_invitations ENABLE ROW LEVEL SECURITY;

-- Providers can view their own invitations
CREATE POLICY "Providers can view their invitations"
ON public.clerk_invitations
FOR SELECT
USING (auth.uid() = provider_id);

-- Providers can create invitations
CREATE POLICY "Providers can create invitations"
ON public.clerk_invitations
FOR INSERT
WITH CHECK (auth.uid() = provider_id AND has_role(auth.uid(), 'provider'));

-- Providers can update their invitations (cancel)
CREATE POLICY "Providers can update their invitations"
ON public.clerk_invitations
FOR UPDATE
USING (auth.uid() = provider_id);

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.clerk_invitations
FOR SELECT
USING (true);

-- Authenticated users can accept invitations
CREATE POLICY "Users can accept invitations"
ON public.clerk_invitations
FOR UPDATE
USING (status = 'pending' AND expires_at > now())
WITH CHECK (status = 'accepted');