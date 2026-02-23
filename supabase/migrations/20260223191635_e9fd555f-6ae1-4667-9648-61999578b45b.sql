
-- ============================================================
-- 1. New tables: organisations, organisation_members
-- ============================================================

CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organisation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  org_role text NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'active',
  invited_email text,
  invite_token uuid DEFAULT gen_random_uuid(),
  invited_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, user_id)
);

ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. New columns on jobs and properties
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS organisation_id uuid;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS organisation_id uuid;

-- ============================================================
-- 3. Security definer functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organisation_id FROM organisation_members
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_role FROM organisation_members
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;

-- Backfill function: called after org creation to tag existing data
CREATE OR REPLACE FUNCTION public.backfill_org_data(_user_id uuid, _org_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs SET organisation_id = _org_id
  WHERE client_id = _user_id AND organisation_id IS NULL;

  UPDATE public.properties SET organisation_id = _org_id
  WHERE client_id = _user_id AND organisation_id IS NULL;
END;
$$;

-- ============================================================
-- 4. RLS policies: organisations
-- ============================================================

CREATE POLICY "Members can view their own organisation"
ON public.organisations FOR SELECT TO authenticated
USING (id = get_user_org_id(auth.uid()));

CREATE POLICY "Owners can update their organisation"
ON public.organisations FOR UPDATE TO authenticated
USING (id = get_user_org_id(auth.uid()) AND get_user_org_role(auth.uid()) = 'owner');

CREATE POLICY "Clients can create organisations"
ON public.organisations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND has_role(auth.uid(), 'client'));

CREATE POLICY "Admins can view all organisations"
ON public.organisations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. RLS policies: organisation_members
-- ============================================================

CREATE POLICY "Members can view org members"
ON public.organisation_members FOR SELECT TO authenticated
USING (organisation_id = get_user_org_id(auth.uid()));

CREATE POLICY "Owners can insert org members"
ON public.organisation_members FOR INSERT TO authenticated
WITH CHECK (
  organisation_id = get_user_org_id(auth.uid())
  AND get_user_org_role(auth.uid()) = 'owner'
);

CREATE POLICY "Owners can update org members"
ON public.organisation_members FOR UPDATE TO authenticated
USING (
  organisation_id = get_user_org_id(auth.uid())
  AND get_user_org_role(auth.uid()) = 'owner'
);

CREATE POLICY "Admins can manage all org members"
ON public.organisation_members FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Self-insert policy for org creator (owner inserting themselves)
CREATE POLICY "Users can insert themselves as owner"
ON public.organisation_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND org_role = 'owner');

-- ============================================================
-- 6. Additive RLS policies on jobs for org visibility
-- ============================================================

CREATE POLICY "Org members can view org jobs"
ON public.jobs FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND organisation_id = get_user_org_id(auth.uid())
);

CREATE POLICY "Org staff can insert org jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (
  organisation_id IS NOT NULL
  AND organisation_id = get_user_org_id(auth.uid())
  AND auth.uid() = created_by_user_id
);

CREATE POLICY "Org staff can update safe fields on org jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (
  organisation_id IS NOT NULL
  AND organisation_id = get_user_org_id(auth.uid())
);

-- ============================================================
-- 7. Additive RLS policies on properties for org visibility
-- ============================================================

CREATE POLICY "Org members can view org properties"
ON public.properties FOR SELECT TO authenticated
USING (
  organisation_id IS NOT NULL
  AND organisation_id = get_user_org_id(auth.uid())
);

CREATE POLICY "Org members can insert org properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (
  organisation_id IS NOT NULL
  AND organisation_id = get_user_org_id(auth.uid())
);

CREATE POLICY "Org members can update org properties"
ON public.properties FOR UPDATE TO authenticated
USING (
  organisation_id IS NOT NULL
  AND organisation_id = get_user_org_id(auth.uid())
);

-- ============================================================
-- 8. Additive RLS on property_change_logs for org visibility
-- ============================================================

CREATE POLICY "Org members can view org property change logs"
ON public.property_change_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_change_logs.property_id
    AND p.organisation_id IS NOT NULL
    AND p.organisation_id = get_user_org_id(auth.uid())
  )
);

-- ============================================================
-- 9. Additive RLS on tenant_details for org visibility
-- ============================================================

CREATE POLICY "Org members can view org tenant details"
ON public.tenant_details FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = tenant_details.job_id
    AND j.organisation_id IS NOT NULL
    AND j.organisation_id = get_user_org_id(auth.uid())
  )
);

CREATE POLICY "Org members can insert org tenant details"
ON public.tenant_details FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = tenant_details.job_id
    AND j.organisation_id IS NOT NULL
    AND j.organisation_id = get_user_org_id(auth.uid())
  )
);

CREATE POLICY "Org members can update org tenant details"
ON public.tenant_details FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = tenant_details.job_id
    AND j.organisation_id IS NOT NULL
    AND j.organisation_id = get_user_org_id(auth.uid())
  )
);

-- ============================================================
-- 10. Org notification trigger on jobs
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_org_on_job_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_address TEXT;
  v_org_owner_id uuid;
  v_creator_id uuid;
  v_msg TEXT;
  v_title TEXT;
BEGIN
  -- Only for org jobs
  IF NEW.organisation_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get property address
  SELECT p.address_line_1 INTO v_address
  FROM public.properties p WHERE p.id = NEW.property_id;

  v_creator_id := NEW.created_by_user_id;

  -- Find org owner
  SELECT om.user_id INTO v_org_owner_id
  FROM public.organisation_members om
  WHERE om.organisation_id = NEW.organisation_id
    AND om.org_role = 'owner'
    AND om.status = 'active'
  LIMIT 1;

  -- New job created (INSERT trigger)
  IF TG_OP = 'INSERT' THEN
    v_title := 'New Booking Created';
    v_msg := 'A booking has been created for ' || COALESCE(v_address, 'a property');

    -- Notify owner if creator is not the owner
    IF v_org_owner_id IS NOT NULL AND v_org_owner_id IS DISTINCT FROM v_creator_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (v_org_owner_id, 'job', v_title, v_msg, '/dashboard/jobs/' || NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE trigger: detect changes
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'cancelled' THEN
        v_title := 'Booking Cancelled';
        v_msg := 'Booking for ' || COALESCE(v_address, 'a property') || ' has been cancelled.';
      ELSE
        v_title := 'Booking Updated';
        v_msg := 'Status changed to ' || NEW.status || ' for ' || COALESCE(v_address, 'a property');
      END IF;

    -- Reschedule requested
    ELSIF OLD.reschedule_requested_at IS NULL AND NEW.reschedule_requested_at IS NOT NULL THEN
      v_title := 'Reschedule Requested';
      v_msg := 'A reschedule has been requested for ' || COALESCE(v_address, 'a property');

    -- Special instructions changed
    ELSIF OLD.special_instructions IS DISTINCT FROM NEW.special_instructions THEN
      v_title := 'Booking Details Updated';
      v_msg := 'Special instructions updated for ' || COALESCE(v_address, 'a property');

    ELSE
      RETURN NEW; -- No relevant change
    END IF;

    -- Notify creator (if not the one making the change — we can't know who made it in a trigger, so notify both)
    IF v_creator_id IS NOT NULL AND v_creator_id IS DISTINCT FROM v_org_owner_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (v_creator_id, 'job', v_title, v_msg, '/dashboard/jobs/' || NEW.id);
    END IF;

    IF v_org_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (v_org_owner_id, 'job', v_title, v_msg, '/dashboard/jobs/' || NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_org_on_job_change_trigger
AFTER INSERT OR UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.notify_org_on_job_change();

-- ============================================================
-- 11. Updated_at trigger for organisations
-- ============================================================

CREATE TRIGGER update_organisations_updated_at
BEFORE UPDATE ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
