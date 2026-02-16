
-- Admin RLS policies for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin RLS policies for jobs
CREATE POLICY "Admins can view all jobs"
ON public.jobs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all jobs"
ON public.jobs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin RLS policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all clerk invitations
CREATE POLICY "Admins can view all invitations"
ON public.clerk_invitations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all inspection reports
CREATE POLICY "Admins can view all reports"
ON public.inspection_reports FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add verification columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '[]'::jsonb;

-- Disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  raised_by UUID NOT NULL,
  raised_against UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all disputes"
ON public.disputes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own disputes"
ON public.disputes FOR SELECT
USING (auth.uid() = raised_by OR auth.uid() = raised_against);

CREATE POLICY "Users can create disputes"
ON public.disputes FOR INSERT
WITH CHECK (auth.uid() = raised_by);

CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Strikes table
CREATE TABLE public.strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id UUID NOT NULL,
  reason TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  issued_by UUID NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all strikes"
ON public.strikes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clerks can view their own strikes"
ON public.strikes FOR SELECT
USING (auth.uid() = clerk_id);
