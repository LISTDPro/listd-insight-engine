
-- Add snapshot name columns
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_by_name text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_by_name text;

-- Backfill created_by_name from profiles
UPDATE public.jobs j
SET created_by_name = p.full_name
FROM public.profiles p
WHERE j.created_by_user_id = p.user_id
  AND j.created_by_name IS NULL
  AND j.created_by_user_id IS NOT NULL;

-- Backfill assigned_by_name from profiles
UPDATE public.jobs j
SET assigned_by_name = p.full_name
FROM public.profiles p
WHERE j.assigned_by = p.user_id
  AND j.assigned_by_name IS NULL
  AND j.assigned_by IS NOT NULL;

-- Create trigger function to auto-populate names
CREATE OR REPLACE FUNCTION public.snapshot_job_actor_names()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Snapshot created_by_name on INSERT or when created_by_user_id changes
  IF (TG_OP = 'INSERT' AND NEW.created_by_user_id IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id AND NEW.created_by_user_id IS NOT NULL)
  THEN
    SELECT full_name INTO NEW.created_by_name
    FROM public.profiles
    WHERE user_id = NEW.created_by_user_id;
  END IF;

  -- Snapshot assigned_by_name on INSERT or when assigned_by changes
  IF (TG_OP = 'INSERT' AND NEW.assigned_by IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.assigned_by IS DISTINCT FROM OLD.assigned_by AND NEW.assigned_by IS NOT NULL)
  THEN
    SELECT full_name INTO NEW.assigned_by_name
    FROM public.profiles
    WHERE user_id = NEW.assigned_by;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_snapshot_job_actor_names
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.snapshot_job_actor_names();
