-- ============================================================
-- LISTD Complete Database Schema Export
-- Generated: 2026-03-16
-- Source: Lovable Cloud project ssbheyzutjusdtyckbfq
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('client', 'provider', 'clerk', 'admin');
CREATE TYPE public.condition_rating AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged', 'missing', 'na');
CREATE TYPE public.furnished_status AS ENUM ('furnished', 'unfurnished', 'part_furnished');
CREATE TYPE public.inspection_type AS ENUM ('new_inventory', 'check_in', 'check_out', 'mid_term', 'interim');
CREATE TYPE public.item_condition AS ENUM ('good', 'fair', 'poor', 'na');
CREATE TYPE public.job_status AS ENUM ('draft', 'pending', 'published', 'accepted', 'assigned', 'in_progress', 'submitted', 'reviewed', 'signed', 'completed', 'paid', 'cancelled');
CREATE TYPE public.property_type AS ENUM ('studio', '1_bed', '2_bed', '3_bed', '4_bed', '5_bed', '6_bed', '7_bed', '8_bed', '9_bed');
CREATE TYPE public.room_type AS ENUM ('entrance', 'hallway', 'living_room', 'dining_room', 'kitchen', 'bedroom', 'bathroom', 'toilet', 'utility', 'storage', 'garden', 'garage', 'balcony', 'other');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  company_name text,
  phone text,
  avatar_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  terms_agreed_at timestamptz,
  non_circumvention_agreed_at timestamptz,
  clerk_jobs_completed integer DEFAULT 0,
  clerk_rating numeric DEFAULT 0,
  clerk_level integer DEFAULT 1,
  is_super_admin boolean NOT NULL DEFAULT false,
  provider_id uuid,
  verification_documents jsonb DEFAULT '[]'::jsonb,
  verification_status text DEFAULT 'unverified'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- organisations
CREATE TABLE public.organisations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organisations_pkey PRIMARY KEY (id)
);

-- organisation_members
CREATE TABLE public.organisation_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id),
  user_id uuid NOT NULL,
  org_role text NOT NULL DEFAULT 'staff'::text,
  status text NOT NULL DEFAULT 'active'::text,
  invite_token uuid DEFAULT gen_random_uuid(),
  invited_at timestamptz,
  invited_email text,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organisation_members_pkey PRIMARY KEY (id)
);

-- properties
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  postcode text NOT NULL,
  property_type property_type NOT NULL DEFAULT 'studio'::property_type,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 1,
  kitchens integer NOT NULL DEFAULT 1,
  living_rooms integer NOT NULL DEFAULT 1,
  dining_areas integer NOT NULL DEFAULT 0,
  utility_rooms integer NOT NULL DEFAULT 0,
  storage_rooms integer NOT NULL DEFAULT 0,
  hallways_stairs integer NOT NULL DEFAULT 0,
  gardens integer NOT NULL DEFAULT 0,
  communal_areas integer NOT NULL DEFAULT 0,
  furnished_status furnished_status NOT NULL DEFAULT 'unfurnished'::furnished_status,
  heavily_furnished boolean NOT NULL DEFAULT false,
  notes text,
  organisation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id)
);

-- jobs
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  client_id uuid NOT NULL,
  provider_id uuid,
  clerk_id uuid,
  inspection_type inspection_type NOT NULL,
  inspection_types text[],
  scheduled_date date NOT NULL,
  preferred_time_slot text,
  status job_status NOT NULL DEFAULT 'draft'::job_status,
  service_tier text NOT NULL DEFAULT 'standard'::text,
  special_instructions text,
  quoted_price numeric,
  final_price numeric,
  short_notice_surcharge_applied boolean NOT NULL DEFAULT false,
  
  -- Clerk payout fields
  clerk_payout numeric DEFAULT 0,
  clerk_bonus numeric DEFAULT 0,
  clerk_final_payout numeric DEFAULT 0,
  clerk_payout_locked boolean DEFAULT false,
  clerk_payment_date timestamptz,
  clerk_level_at_job integer DEFAULT 1,
  clerk_payout_breakdown jsonb DEFAULT '{}'::jsonb,
  clerk_payout_log jsonb DEFAULT '[]'::jsonb,
  margin numeric DEFAULT 0,
  
  -- Acknowledgement fields
  client_pre_inspection_ack boolean DEFAULT false,
  client_pre_inspection_ack_at timestamptz,
  client_report_accepted boolean DEFAULT false,
  client_report_accepted_at timestamptz,
  client_report_comments text,
  client_signature_url text,
  client_signature_at timestamptz,
  clerk_report_submitted_ack boolean DEFAULT false,
  clerk_report_submitted_ack_at timestamptz,
  provider_job_completed_ack boolean DEFAULT false,
  provider_job_completed_ack_at timestamptz,
  tier_acknowledged_at timestamptz,
  policy_acknowledged_at timestamptz,
  
  -- Status tracking
  accepted_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid,
  cancellation_fee numeric DEFAULT 0,
  
  -- Reschedule
  reschedule_requested_date date,
  reschedule_requested_time_slot text,
  reschedule_requested_at timestamptz,
  reschedule_resolved_by uuid,
  reschedule_resolved_at timestamptz,
  reschedule_status text,
  
  -- Actor tracking
  created_by_user_id uuid,
  created_by_name text,
  assigned_by uuid,
  assigned_by_name text,
  
  -- Organisation
  organisation_id uuid,
  
  -- External integrations
  inventorybase_job_id text,
  report_url text,
  review_email_sent_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id)
);

-- inspection_reports
CREATE TABLE public.inspection_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  clerk_id uuid NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  submitted_at timestamptz,
  general_notes text,
  meter_readings jsonb DEFAULT '{}'::jsonb,
  keys_info jsonb DEFAULT '{}'::jsonb,
  smoke_alarms_checked boolean DEFAULT false,
  carbon_monoxide_checked boolean DEFAULT false,
  clerk_signature_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_reports_pkey PRIMARY KEY (id)
);

-- inspection_rooms
CREATE TABLE public.inspection_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.inspection_reports(id),
  room_type room_type NOT NULL,
  room_name text NOT NULL,
  room_order integer NOT NULL DEFAULT 0,
  overall_condition condition_rating,
  notes text,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_rooms_pkey PRIMARY KEY (id)
);

-- inspection_items
CREATE TABLE public.inspection_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.inspection_rooms(id),
  item_name text NOT NULL,
  item_category text,
  item_order integer NOT NULL DEFAULT 0,
  description text,
  condition condition_rating,
  condition_notes text,
  cleanliness text,
  cleanliness_notes text,
  quantity integer DEFAULT 1,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_items_pkey PRIMARY KEY (id)
);

-- inspection_photos
CREATE TABLE public.inspection_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.inspection_reports(id),
  room_id uuid REFERENCES public.inspection_rooms(id),
  item_id uuid REFERENCES public.inspection_items(id),
  photo_url text NOT NULL,
  caption text,
  taken_at timestamptz DEFAULT now(),
  is_mandatory boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_photos_pkey PRIMARY KEY (id)
);

-- inspection_rooms_map
CREATE TABLE public.inspection_rooms_map (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  room_name text NOT NULL,
  room_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_rooms_map_pkey PRIMARY KEY (id)
);

-- inspection_items_map
CREATE TABLE public.inspection_items_map (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.inspection_rooms_map(id),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  item_name text NOT NULL,
  condition item_condition DEFAULT 'na'::item_condition,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_items_map_pkey PRIMARY KEY (id)
);

-- inspection_item_photos
CREATE TABLE public.inspection_item_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  job_id uuid NOT NULL,
  photo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_item_photos_pkey PRIMARY KEY (id)
);

-- generated_reports
CREATE TABLE public.generated_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  generated_by uuid NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  report_url text,
  sent_to_email text,
  sent_at timestamptz,
  tenant_signature text,
  tenant_token text,
  signed_at timestamptz,
  CONSTRAINT generated_reports_pkey PRIMARY KEY (id)
);

-- tenant_details
CREATE TABLE public.tenant_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  full_name text,
  email text,
  phone text,
  tenant_order integer NOT NULL DEFAULT 1,
  tenant_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_details_pkey PRIMARY KEY (id)
);

-- escrow_payments
CREATE TABLE public.escrow_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  client_id uuid NOT NULL,
  clerk_id uuid,
  provider_id uuid,
  gross_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  provider_fee numeric NOT NULL DEFAULT 0,
  clerk_payout numeric NOT NULL DEFAULT 0,
  cancellation_fee numeric DEFAULT 0,
  cancellation_reason text,
  cancelled_by uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  stripe_refund_id text,
  held_at timestamptz,
  auto_release_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escrow_payments_pkey PRIMARY KEY (id)
);

-- messages
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message_text text NOT NULL,
  attachment_url text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- notification_preferences
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_job_updates boolean NOT NULL DEFAULT true,
  email_payment_updates boolean NOT NULL DEFAULT true,
  email_report_delivery boolean NOT NULL DEFAULT true,
  email_new_messages boolean NOT NULL DEFAULT true,
  email_marketing boolean NOT NULL DEFAULT false,
  inapp_job_updates boolean NOT NULL DEFAULT true,
  inapp_payment_updates boolean NOT NULL DEFAULT true,
  inapp_report_delivery boolean NOT NULL DEFAULT true,
  inapp_new_messages boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id)
);

-- reviews
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating integer NOT NULL,
  review_text text,
  clerk_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);

-- disputes
CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  raised_by uuid NOT NULL,
  raised_against uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open'::text,
  resolution text,
  admin_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT disputes_pkey PRIMARY KEY (id)
);

-- strikes
CREATE TABLE public.strikes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id uuid NOT NULL,
  reason text NOT NULL,
  severity integer NOT NULL DEFAULT 1,
  issued_by uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT strikes_pkey PRIMARY KEY (id)
);

-- clerk_incidents
CREATE TABLE public.clerk_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id),
  incident_type text NOT NULL,
  severity text NOT NULL DEFAULT 'flag'::text,
  notes text,
  restrict_priority boolean NOT NULL DEFAULT false,
  logged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clerk_incidents_pkey PRIMARY KEY (id)
);

-- clerk_invitations
CREATE TABLE public.clerk_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + '7 days'::interval),
  accepted_at timestamptz,
  CONSTRAINT clerk_invitations_pkey PRIMARY KEY (id)
);

-- email_logs
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent'::text,
  resend_id text,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);

-- platform_settings
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_pkey PRIMARY KEY (id),
  CONSTRAINT platform_settings_key_key UNIQUE (key)
);

-- property_change_logs
CREATE TABLE public.property_change_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  changed_by uuid NOT NULL,
  changes jsonb NOT NULL,
  may_affect_pricing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_change_logs_pkey PRIMARY KEY (id)
);

-- waitlist_leads
CREATE TABLE public.waitlist_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL,
  portfolio_size text,
  monthly_volume text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_leads_pkey PRIMARY KEY (id)
);

-- xero_connections
CREATE TABLE public.xero_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id text NOT NULL,
  tenant_name text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  scopes text,
  token_expires_at timestamptz NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xero_connections_pkey PRIMARY KEY (id)
);
