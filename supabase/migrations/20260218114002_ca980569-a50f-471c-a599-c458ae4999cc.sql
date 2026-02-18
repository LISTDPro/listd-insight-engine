
-- Trigger to insert in-app notifications for clerks when key job events occur

CREATE OR REPLACE FUNCTION public.notify_clerk_on_job_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_address TEXT;
  v_city    TEXT;
  v_type    TEXT;
BEGIN
  -- Only act when clerk_id is set
  IF NEW.clerk_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lookup property address for the message
  SELECT
    p.address_line_1,
    p.city,
    NEW.inspection_type::text
  INTO v_address, v_city, v_type
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  -- ── 1. Job assigned to clerk (status becomes 'accepted' or 'assigned' and clerk_id was just set) ──
  IF (OLD.clerk_id IS NULL AND NEW.clerk_id IS NOT NULL)
     OR (OLD.status <> 'accepted' AND NEW.status = 'accepted' AND NEW.clerk_id IS NOT NULL) THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id,
      'job',
      'Job Assigned to You',
      COALESCE(v_type, 'Inspection') || ' at ' || COALESCE(v_address, 'your property') || ', ' || COALESCE(v_city, ''),
      '/dashboard/jobs/' || NEW.id
    );

  -- ── 2. Client acknowledged pre-inspection details ──
  ELSIF OLD.client_pre_inspection_ack IS DISTINCT FROM NEW.client_pre_inspection_ack
    AND NEW.client_pre_inspection_ack = TRUE THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id,
      'job',
      'Client Confirmed Job Details',
      'The client has verified property details for the ' || COALESCE(v_type, 'inspection') || ' at ' || COALESCE(v_address, 'the property'),
      '/dashboard/jobs/' || NEW.id
    );

  -- ── 3. Client accepted the report ──
  ELSIF OLD.client_report_accepted IS DISTINCT FROM NEW.client_report_accepted
    AND NEW.client_report_accepted = TRUE THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id,
      'payment',
      'Report Accepted — Payment Processing',
      'Your report for ' || COALESCE(v_address, 'the property') || ' has been accepted by the client. Payment will be released shortly.',
      '/dashboard/payments'
    );

  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to jobs table
DROP TRIGGER IF EXISTS trg_notify_clerk_on_job_update ON public.jobs;
CREATE TRIGGER trg_notify_clerk_on_job_update
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_clerk_on_job_update();
