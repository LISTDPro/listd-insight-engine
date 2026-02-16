
-- Table to store Xero OAuth connections per user
CREATE TABLE public.xero_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.xero_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view their own xero connections"
ON public.xero_connections
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert their own xero connections"
ON public.xero_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update their own xero connections"
ON public.xero_connections
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete their own xero connections"
ON public.xero_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all connections
CREATE POLICY "Admins can view all xero connections"
ON public.xero_connections
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_xero_connections_updated_at
BEFORE UPDATE ON public.xero_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
