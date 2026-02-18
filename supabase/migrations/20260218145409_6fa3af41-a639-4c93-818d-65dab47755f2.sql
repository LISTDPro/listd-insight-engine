-- Re-attach the trigger to the jobs table (the function already exists)
DROP TRIGGER IF EXISTS trg_notify_clerk_on_job_update ON public.jobs;

CREATE TRIGGER trg_notify_clerk_on_job_update
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_clerk_on_job_update();