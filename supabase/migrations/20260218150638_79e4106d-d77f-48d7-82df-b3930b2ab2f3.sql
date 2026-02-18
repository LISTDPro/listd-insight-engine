-- Extend the job notification trigger to also notify CLIENTS
-- Adding two new client notification events:
--   1. Clerk accepted job → client notified "Your Clerk is Confirmed"
--   2. Report submitted   → client notified "Report Ready to Review"
-- Also fixes the inspection type display (raw enum → readable label)

CREATE OR REPLACE FUNCTION public.notify_clerk_on_job_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_address TEXT;
  v_city    TEXT;
  v_type    TEXT;
  v_type_label TEXT;
BEGIN
  -- Lookup property address for the message
  SELECT
    p.address_line_1,
    p.city,
    NEW.inspection_type::text
  INTO v_address, v_city, v_type
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  -- Convert raw enum to human-readable label
  v_type_label := CASE v_type
    WHEN 'new_inventory' THEN 'New Inventory'
    WHEN 'check_in'      THEN 'Check-In'
    WHEN 'check_out'     THEN 'Check-Out'
    WHEN 'mid_term'      THEN 'Mid-Term'
    WHEN 'interim'       THEN 'Interim'
    ELSE initcap(replace(v_type, '_', ' '))
  END;

  -- ── CLERK NOTIFICATIONS ──────────────────────────────────────────────────

  -- 1. Job assigned to clerk (clerk_id set for the first time)
  IF NEW.clerk_id IS NOT NULL
     AND (OLD.clerk_id IS NULL AND NEW.clerk_id IS NOT NULL) THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id,
      'job',
      'Job Assigned to You',
      v_type_label || ' at ' || COALESCE(v_address, 'your property') || ', ' || COALESCE(v_city, ''),
      '/dashboard/jobs/' || NEW.id
    );

  -- 2. Client acknowledged pre-inspection details → notify clerk
  ELSIF OLD.client_pre_inspection_ack IS DISTINCT FROM NEW.client_pre_inspection_ack
    AND NEW.client_pre_inspection_ack = TRUE
    AND NEW.clerk_id IS NOT NULL THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id,
      'job',
      'Client Confirmed Job Details',
      'The client has verified property details for the ' || v_type_label || ' at ' || COALESCE(v_address, 'the property'),
      '/dashboard/jobs/' || NEW.id
    );

  -- 3. Client accepted the report → notify clerk
  ELSIF OLD.client_report_accepted IS DISTINCT FROM NEW.client_report_accepted
    AND NEW.client_report_accepted = TRUE
    AND NEW.clerk_id IS NOT NULL THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id,
      'payment',
      'Report Accepted — Payment Processing',
      'Your report for ' || COALESCE(v_address, 'the property') || ' has been accepted. Payment will be released shortly.',
      '/dashboard/payments'
    );

  END IF;

  -- ── CLIENT NOTIFICATIONS ─────────────────────────────────────────────────

  -- 4. Clerk accepted the job → notify client
  IF OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'accepted'
    AND NEW.clerk_id IS NOT NULL THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.client_id,
      'job',
      'Your Clerk is Confirmed',
      'A clerk has been assigned to your ' || v_type_label || ' at ' || COALESCE(v_address, 'your property') || ', ' || COALESCE(v_city, ''),
      '/dashboard/jobs/' || NEW.id
    );

  -- 5. Report submitted → notify client it's ready to review
  ELSIF OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'submitted' THEN

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.client_id,
      'job',
      'Report Ready to Review',
      'Your ' || v_type_label || ' report for ' || COALESCE(v_address, 'your property') || ', ' || COALESCE(v_city, '') || ' is ready. Please review and accept.',
      '/dashboard/jobs/' || NEW.id
    );

  END IF;

  RETURN NEW;
END;
$function$;