-- Add admin in-app notification when client accepts a report (escrow release signal)
CREATE OR REPLACE FUNCTION public.notify_clerk_on_job_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_address    TEXT;
  v_city       TEXT;
  v_type       TEXT;
  v_type_label TEXT;
  v_admin      RECORD;
BEGIN
  -- Lookup property address
  SELECT p.address_line_1, p.city, NEW.inspection_type::text
  INTO v_address, v_city, v_type
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  -- Human-readable inspection type
  v_type_label := CASE v_type
    WHEN 'new_inventory' THEN 'New Inventory'
    WHEN 'check_in'      THEN 'Check-In'
    WHEN 'check_out'     THEN 'Check-Out'
    WHEN 'mid_term'      THEN 'Mid-Term'
    WHEN 'interim'       THEN 'Interim'
    ELSE initcap(replace(v_type, '_', ' '))
  END;

  -- ── CLERK NOTIFICATIONS ──────────────────────────────────────────────────

  -- 1. Job assigned to clerk
  IF OLD.clerk_id IS NULL AND NEW.clerk_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id, 'job', 'Job Assigned to You',
      v_type_label || ' at ' || COALESCE(v_address, 'your property') || ', ' || COALESCE(v_city, ''),
      '/dashboard/jobs/' || NEW.id
    );

  -- 2. Client confirmed pre-inspection details
  ELSIF OLD.client_pre_inspection_ack IS DISTINCT FROM NEW.client_pre_inspection_ack
    AND NEW.client_pre_inspection_ack = TRUE AND NEW.clerk_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id, 'job', 'Client Confirmed Job Details',
      'The client has verified property details for the ' || v_type_label || ' at ' || COALESCE(v_address, 'the property'),
      '/dashboard/jobs/' || NEW.id
    );

  -- 3. Client accepted the report → notify clerk
  ELSIF OLD.client_report_accepted IS DISTINCT FROM NEW.client_report_accepted
    AND NEW.client_report_accepted = TRUE AND NEW.clerk_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.clerk_id, 'payment', 'Report Accepted — Payment Processing',
      'Your report for ' || COALESCE(v_address, 'the property') || ' has been accepted. Payment will be released shortly.',
      '/dashboard/payments'
    );
  END IF;

  -- ── CLIENT NOTIFICATIONS ─────────────────────────────────────────────────

  -- 4. Clerk accepted the job → notify client
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted' AND NEW.clerk_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.client_id, 'job', 'Your Clerk is Confirmed',
      'A clerk has been assigned to your ' || v_type_label || ' at ' || COALESCE(v_address, 'your property') || ', ' || COALESCE(v_city, ''),
      '/dashboard/jobs/' || NEW.id
    );

  -- 5. Report submitted → notify client
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'submitted' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.client_id, 'job', 'Report Ready to Review',
      'Your ' || v_type_label || ' report for ' || COALESCE(v_address, 'your property') || ', ' || COALESCE(v_city, '') || ' is ready. Please review and accept.',
      '/dashboard/jobs/' || NEW.id
    );
  END IF;

  -- ── ADMIN NOTIFICATIONS ──────────────────────────────────────────────────

  -- 6. Client accepted the report → notify all admins to release escrow
  IF OLD.client_report_accepted IS DISTINCT FROM NEW.client_report_accepted
    AND NEW.client_report_accepted = TRUE THEN
    FOR v_admin IN
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        v_admin.user_id, 'payment', 'Escrow Release Required',
        'Client accepted the ' || v_type_label || ' report for ' || COALESCE(v_address, 'a property') || ', ' || COALESCE(v_city, '') || '. Please release the escrow payment.',
        '/dashboard/jobs/' || NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;