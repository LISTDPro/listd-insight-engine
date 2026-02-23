
-- Trigger function: notify admins and assigned clerks when a property change log is inserted
CREATE OR REPLACE FUNCTION public.notify_on_property_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_address TEXT;
  v_city TEXT;
  v_changes jsonb;
  v_summary TEXT;
  v_pricing_note TEXT := '';
  v_admin RECORD;
  v_job RECORD;
  v_field TEXT;
  v_parts TEXT[] := '{}';
  v_field_labels jsonb := '{
    "address_line_1": "Address",
    "address_line_2": "Address Line 2",
    "city": "City",
    "postcode": "Postcode",
    "property_type": "Property Type",
    "bedrooms": "Bedrooms",
    "bathrooms": "Bathrooms",
    "kitchens": "Kitchens",
    "living_rooms": "Living Rooms",
    "dining_areas": "Dining Areas",
    "utility_rooms": "Utility Rooms",
    "storage_rooms": "Storage Rooms",
    "hallways_stairs": "Hallways",
    "gardens": "Gardens",
    "communal_areas": "Communal Areas",
    "furnished_status": "Furnished Status",
    "heavily_furnished": "Heavily Furnished"
  }'::jsonb;
BEGIN
  -- Get property address
  SELECT p.address_line_1, p.city INTO v_address, v_city
  FROM public.properties p WHERE p.id = NEW.property_id;

  -- Build human-readable summary
  v_changes := NEW.changes;
  FOR v_field IN SELECT jsonb_object_keys(v_changes)
  LOOP
    v_parts := array_append(v_parts,
      COALESCE(v_field_labels->>v_field, v_field) || ': ' ||
      COALESCE((v_changes->v_field->>'old')::text, '—') || ' → ' ||
      COALESCE((v_changes->v_field->>'new')::text, '—')
    );
  END LOOP;

  v_summary := array_to_string(v_parts, ', ');

  IF NEW.may_affect_pricing THEN
    v_pricing_note := ' Pricing review may be required.';
  END IF;

  -- Notify for each active job linked to this property
  FOR v_job IN
    SELECT id, clerk_id FROM public.jobs
    WHERE property_id = NEW.property_id
    AND status NOT IN ('completed', 'paid', 'cancelled')
  LOOP
    -- Notify all admins
    FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        v_admin.user_id, 'job', 'Property Details Changed',
        v_summary || '.' || v_pricing_note,
        '/dashboard/jobs/' || v_job.id
      );
    END LOOP;

    -- Notify assigned clerk
    IF v_job.clerk_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        v_job.clerk_id, 'job', 'Property Details Changed',
        v_summary || '.' || v_pricing_note,
        '/dashboard/jobs/' || v_job.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_property_change_log_inserted
AFTER INSERT ON public.property_change_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_property_change();
