
-- Add tenant_token to tenant_details for portal access
ALTER TABLE public.tenant_details ADD COLUMN IF NOT EXISTS tenant_token text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_details_token ON public.tenant_details(tenant_token) WHERE tenant_token IS NOT NULL;

-- Add tenant signing columns to generated_reports
ALTER TABLE public.generated_reports ADD COLUMN IF NOT EXISTS tenant_signature text;
ALTER TABLE public.generated_reports ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE public.generated_reports ADD COLUMN IF NOT EXISTS tenant_token text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_reports_tenant_token ON public.generated_reports(tenant_token) WHERE tenant_token IS NOT NULL;

-- Function: validate token and return portal data
CREATE OR REPLACE FUNCTION public.tenant_portal_data(_token text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant record;
  v_job record;
  v_property record;
  v_reports json;
BEGIN
  SELECT * INTO v_tenant FROM tenant_details WHERE tenant_token = _token LIMIT 1;
  IF v_tenant IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO v_job FROM jobs WHERE id = v_tenant.job_id LIMIT 1;
  IF v_job IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO v_property FROM properties WHERE id = v_job.property_id LIMIT 1;

  SELECT json_agg(row_to_json(sub)) INTO v_reports FROM (
    SELECT id, job_id, generated_at, report_url, tenant_signature, signed_at
    FROM generated_reports WHERE job_id = v_tenant.job_id ORDER BY generated_at DESC
  ) sub;

  RETURN json_build_object(
    'tenant', json_build_object('id', v_tenant.id, 'full_name', v_tenant.full_name, 'email', v_tenant.email, 'phone', v_tenant.phone, 'job_id', v_tenant.job_id),
    'job', json_build_object('id', v_job.id, 'inspection_type', v_job.inspection_type, 'scheduled_date', v_job.scheduled_date, 'status', v_job.status),
    'property', json_build_object('address_line_1', v_property.address_line_1, 'address_line_2', v_property.address_line_2, 'city', v_property.city, 'postcode', v_property.postcode),
    'reports', COALESCE(v_reports, '[]'::json)
  );
END;
$$;

-- Function: get report detail (rooms, items, photos)
CREATE OR REPLACE FUNCTION public.tenant_report_detail(_token text, _job_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_rooms json;
BEGIN
  SELECT id INTO v_tenant_id FROM tenant_details WHERE tenant_token = _token AND job_id = _job_id LIMIT 1;
  IF v_tenant_id IS NULL THEN RETURN NULL; END IF;

  SELECT json_agg(
    json_build_object(
      'id', r.id,
      'room_name', r.room_name,
      'room_order', r.room_order,
      'items', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'id', i.id,
            'item_name', i.item_name,
            'condition', i.condition,
            'notes', i.notes,
            'photos', (
              SELECT COALESCE(json_agg(json_build_object('id', p.id, 'photo_url', p.photo_url)), '[]'::json)
              FROM inspection_item_photos p WHERE p.item_id = i.id
            )
          )
        ), '[]'::json)
        FROM inspection_items_map i WHERE i.room_id = r.id AND i.job_id = _job_id
      )
    ) ORDER BY r.room_order
  ) INTO v_rooms
  FROM inspection_rooms_map r WHERE r.job_id = _job_id;

  RETURN COALESCE(v_rooms, '[]'::json);
END;
$$;

-- Function: sign a report
CREATE OR REPLACE FUNCTION public.tenant_sign_report(_token text, _report_id uuid, _signature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  SELECT job_id INTO v_job_id FROM tenant_details WHERE tenant_token = _token LIMIT 1;
  IF v_job_id IS NULL THEN RETURN false; END IF;

  UPDATE generated_reports
  SET tenant_signature = _signature, signed_at = now()
  WHERE id = _report_id AND job_id = v_job_id AND signed_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Function: generate a portal token for a tenant
CREATE OR REPLACE FUNCTION public.generate_tenant_portal_token(_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');
  UPDATE tenant_details SET tenant_token = v_token WHERE id = _tenant_id;
  RETURN v_token;
END;
$$;

-- Grant anon access to portal functions (tenants are unauthenticated)
GRANT EXECUTE ON FUNCTION public.tenant_portal_data(text) TO anon;
GRANT EXECUTE ON FUNCTION public.tenant_report_detail(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.tenant_sign_report(text, uuid, text) TO anon;
