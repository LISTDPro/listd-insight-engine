
-- =================================================================
-- Organisation Structure Migration
-- Creates orgs for existing clients & auto-creates for new signups
-- =================================================================

-- 1. Trigger function: auto-create org when a client role is inserted
CREATE OR REPLACE FUNCTION public.auto_create_organisation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_name text;
BEGIN
  -- Only for client role
  IF NEW.role != 'client' THEN
    RETURN NEW;
  END IF;

  -- Skip if user already belongs to an org
  IF EXISTS (
    SELECT 1 FROM organisation_members
    WHERE user_id = NEW.user_id AND status = 'active'
  ) THEN
    RETURN NEW;
  END IF;

  -- Derive org name from profile
  SELECT COALESCE(NULLIF(p.company_name,''), NULLIF(p.full_name,''), 'My Organisation')
  INTO v_name
  FROM profiles p WHERE p.user_id = NEW.user_id;

  v_name := COALESCE(v_name, 'My Organisation');

  -- Create organisation
  INSERT INTO organisations (name, created_by)
  VALUES (v_name, NEW.user_id)
  RETURNING id INTO v_org_id;

  -- Add user as owner
  INSERT INTO organisation_members (organisation_id, user_id, org_role, status)
  VALUES (v_org_id, NEW.user_id, 'owner', 'active');

  -- Backfill any jobs/properties created before org existed
  PERFORM backfill_org_data(NEW.user_id, v_org_id);

  RETURN NEW;
END;
$$;

-- 2. Attach trigger to user_roles table
CREATE TRIGGER on_client_role_created
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_organisation();

-- 3. Backfill: create orgs for ALL existing client users without one
DO $$
DECLARE
  r RECORD;
  v_org_id uuid;
  v_name text;
BEGIN
  FOR r IN
    SELECT ur.user_id
    FROM user_roles ur
    WHERE ur.role = 'client'
      AND NOT EXISTS (
        SELECT 1 FROM organisation_members om
        WHERE om.user_id = ur.user_id AND om.status = 'active'
      )
  LOOP
    -- Derive name
    SELECT COALESCE(NULLIF(p.company_name,''), NULLIF(p.full_name,''), 'My Organisation')
    INTO v_name
    FROM profiles p WHERE p.user_id = r.user_id;

    v_name := COALESCE(v_name, 'My Organisation');

    -- Create org
    INSERT INTO organisations (name, created_by)
    VALUES (v_name, r.user_id)
    RETURNING id INTO v_org_id;

    -- Owner membership
    INSERT INTO organisation_members (organisation_id, user_id, org_role, status)
    VALUES (v_org_id, r.user_id, 'owner', 'active');

    -- Backfill jobs & properties
    PERFORM backfill_org_data(r.user_id, v_org_id);
  END LOOP;

  RAISE NOTICE 'Organisation structure migration applied – %', now();
END $$;
