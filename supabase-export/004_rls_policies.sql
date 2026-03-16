-- ============================================================
-- ROW LEVEL SECURITY + POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_rooms_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_item_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_connections ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers can view their clerks profiles" ON public.profiles FOR SELECT USING (provider_id = auth.uid());
CREATE POLICY "Providers can update their clerks profiles" ON public.profiles FOR UPDATE USING (provider_id = auth.uid());

-- ── USER_ROLES ──
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role during onboarding" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ── ORGANISATIONS ──
CREATE POLICY "Members can view their own organisation" ON public.organisations FOR SELECT TO authenticated USING (id = get_user_org_id(auth.uid()));
CREATE POLICY "Clients can create organisations" ON public.organisations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by) AND has_role(auth.uid(), 'client'));
CREATE POLICY "Owners can update their organisation" ON public.organisations FOR UPDATE TO authenticated USING ((id = get_user_org_id(auth.uid())) AND (get_user_org_role(auth.uid()) = 'owner'));
CREATE POLICY "Admins can view all organisations" ON public.organisations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ── ORGANISATION_MEMBERS ──
CREATE POLICY "Members can view org members" ON public.organisation_members FOR SELECT TO authenticated USING (organisation_id = get_user_org_id(auth.uid()));
CREATE POLICY "Owners can insert org members" ON public.organisation_members FOR INSERT TO authenticated WITH CHECK ((organisation_id = get_user_org_id(auth.uid())) AND (get_user_org_role(auth.uid()) = 'owner'));
CREATE POLICY "Owners can update org members" ON public.organisation_members FOR UPDATE TO authenticated USING ((organisation_id = get_user_org_id(auth.uid())) AND (get_user_org_role(auth.uid()) = 'owner'));
CREATE POLICY "Users can insert themselves as owner" ON public.organisation_members FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (org_role = 'owner'));
CREATE POLICY "Admins can manage all org members" ON public.organisation_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ── PROPERTIES ──
CREATE POLICY "Clients can view their own properties" ON public.properties FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can insert their own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Clients can delete their own properties" ON public.properties FOR DELETE USING (auth.uid() = client_id);
CREATE POLICY "Clerks can view properties for their jobs" ON public.properties FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.property_id = properties.id AND (jobs.clerk_id = auth.uid() OR (jobs.status = 'published' AND has_role(auth.uid(), 'clerk')))));
CREATE POLICY "Org members can view org properties" ON public.properties FOR SELECT TO authenticated USING (organisation_id IS NOT NULL AND organisation_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members can insert org properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (organisation_id IS NOT NULL AND organisation_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members can update org properties" ON public.properties FOR UPDATE TO authenticated USING (organisation_id IS NOT NULL AND organisation_id = get_user_org_id(auth.uid()));

-- ── JOBS ──
-- (Jobs RLS policies are extensive — from the existing schema context they include client, clerk, provider, admin, and org-based access)
CREATE POLICY "Clients can view their own jobs" ON public.jobs FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can insert their own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update their own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Clerks can view their assigned jobs" ON public.jobs FOR SELECT USING (auth.uid() = clerk_id);
CREATE POLICY "Clerks can update their assigned jobs" ON public.jobs FOR UPDATE USING (auth.uid() = clerk_id);
CREATE POLICY "Clerks can view published jobs" ON public.jobs FOR SELECT USING (status = 'published' AND has_role(auth.uid(), 'clerk'));
CREATE POLICY "Providers can view their jobs" ON public.jobs FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Providers can update their jobs" ON public.jobs FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage all jobs" ON public.jobs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can view org jobs" ON public.jobs FOR SELECT TO authenticated USING (organisation_id IS NOT NULL AND organisation_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members can insert org jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (organisation_id IS NOT NULL AND organisation_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members can update org jobs" ON public.jobs FOR UPDATE TO authenticated USING (organisation_id IS NOT NULL AND organisation_id = get_user_org_id(auth.uid()));

-- ── INSPECTION_REPORTS ──
CREATE POLICY "Clerks can insert their own reports" ON public.inspection_reports FOR INSERT WITH CHECK (auth.uid() = clerk_id);
CREATE POLICY "Clerks can update their own reports" ON public.inspection_reports FOR UPDATE USING (auth.uid() = clerk_id);
CREATE POLICY "Clerks can view their own reports" ON public.inspection_reports FOR SELECT USING (auth.uid() = clerk_id);
CREATE POLICY "Clients can view reports for their jobs" ON public.inspection_reports FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = inspection_reports.job_id AND jobs.client_id = auth.uid()));
CREATE POLICY "Admins can view all reports" ON public.inspection_reports FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ── INSPECTION_ROOMS ──
CREATE POLICY "Clerks can manage rooms in their reports" ON public.inspection_rooms FOR ALL USING (EXISTS (SELECT 1 FROM inspection_reports WHERE inspection_reports.id = inspection_rooms.report_id AND inspection_reports.clerk_id = auth.uid()));
CREATE POLICY "Clients can view rooms for their jobs" ON public.inspection_rooms FOR SELECT USING (EXISTS (SELECT 1 FROM inspection_reports ir JOIN jobs j ON j.id = ir.job_id WHERE ir.id = inspection_rooms.report_id AND j.client_id = auth.uid()));

-- ── INSPECTION_ITEMS ──
CREATE POLICY "Clerks can manage items in their reports" ON public.inspection_items FOR ALL USING (EXISTS (SELECT 1 FROM inspection_rooms r JOIN inspection_reports ir ON ir.id = r.report_id WHERE r.id = inspection_items.room_id AND ir.clerk_id = auth.uid()));
CREATE POLICY "Clients can view items for their jobs" ON public.inspection_items FOR SELECT USING (EXISTS (SELECT 1 FROM inspection_rooms r JOIN inspection_reports ir ON ir.id = r.report_id JOIN jobs j ON j.id = ir.job_id WHERE r.id = inspection_items.room_id AND j.client_id = auth.uid()));

-- ── INSPECTION_PHOTOS ──
CREATE POLICY "Clerks can manage photos in their reports" ON public.inspection_photos FOR ALL USING (EXISTS (SELECT 1 FROM inspection_reports WHERE inspection_reports.id = inspection_photos.report_id AND inspection_reports.clerk_id = auth.uid()));
CREATE POLICY "Clients can view photos for their jobs" ON public.inspection_photos FOR SELECT USING (EXISTS (SELECT 1 FROM inspection_reports ir JOIN jobs j ON j.id = ir.job_id WHERE ir.id = inspection_photos.report_id AND j.client_id = auth.uid()));

-- ── INSPECTION_ITEMS_MAP ──
CREATE POLICY "Admins can manage all mapped items" ON public.inspection_items_map FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clerks can manage items for their jobs" ON public.inspection_items_map FOR ALL USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = inspection_items_map.job_id AND jobs.clerk_id = auth.uid()));
CREATE POLICY "Clients can view items for their jobs" ON public.inspection_items_map FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = inspection_items_map.job_id AND jobs.client_id = auth.uid()));

-- ── INSPECTION_ITEM_PHOTOS ──
CREATE POLICY "Admins can manage all item photos" ON public.inspection_item_photos FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clerks can manage photos for their jobs" ON public.inspection_item_photos FOR ALL USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = inspection_item_photos.job_id AND jobs.clerk_id = auth.uid()));
CREATE POLICY "Clients can view photos for their jobs" ON public.inspection_item_photos FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = inspection_item_photos.job_id AND jobs.client_id = auth.uid()));

-- ── GENERATED_REPORTS ──
CREATE POLICY "Admins can manage all generated reports" ON public.generated_reports FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clerks can manage reports for their jobs" ON public.generated_reports FOR ALL USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = generated_reports.job_id AND jobs.clerk_id = auth.uid()));
CREATE POLICY "Clients can view reports for their jobs" ON public.generated_reports FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = generated_reports.job_id AND jobs.client_id = auth.uid()));

-- ── TENANT_DETAILS ──
CREATE POLICY "Admins can manage all tenant details" ON public.tenant_details FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clerks can view tenant details for their jobs" ON public.tenant_details FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = tenant_details.job_id AND jobs.clerk_id = auth.uid()));
CREATE POLICY "Clients can view tenant details for their jobs" ON public.tenant_details FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = tenant_details.job_id AND jobs.client_id = auth.uid()));
CREATE POLICY "Clients can insert tenant details for their jobs" ON public.tenant_details FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = tenant_details.job_id AND jobs.client_id = auth.uid()));
CREATE POLICY "Clients can update tenant details for their jobs" ON public.tenant_details FOR UPDATE USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = tenant_details.job_id AND jobs.client_id = auth.uid()));
CREATE POLICY "Org members can view org tenant details" ON public.tenant_details FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM jobs j WHERE j.id = tenant_details.job_id AND j.organisation_id IS NOT NULL AND j.organisation_id = get_user_org_id(auth.uid())));
CREATE POLICY "Org members can insert org tenant details" ON public.tenant_details FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM jobs j WHERE j.id = tenant_details.job_id AND j.organisation_id IS NOT NULL AND j.organisation_id = get_user_org_id(auth.uid())));
CREATE POLICY "Org members can update org tenant details" ON public.tenant_details FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM jobs j WHERE j.id = tenant_details.job_id AND j.organisation_id IS NOT NULL AND j.organisation_id = get_user_org_id(auth.uid())));

-- ── ESCROW_PAYMENTS ──
CREATE POLICY "Admins can view all escrow payments" ON public.escrow_payments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view their own escrow payments" ON public.escrow_payments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can update their escrow payments" ON public.escrow_payments FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Clerks can view their own escrow payments" ON public.escrow_payments FOR SELECT USING (auth.uid() = clerk_id);
CREATE POLICY "Providers can view their own escrow payments" ON public.escrow_payments FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "System can insert escrow payments" ON public.escrow_payments FOR INSERT WITH CHECK (auth.uid() = client_id);

-- ── MESSAGES ──
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can mark messages as read" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Admins can view all messages" ON public.messages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── NOTIFICATIONS ──
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- ── NOTIFICATION_PREFERENCES ──
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ── REVIEWS ──
CREATE POLICY "Anyone authenticated can view reviews" ON public.reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view reviews they're involved in" ON public.reviews FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);
CREATE POLICY "Reviewers can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewees can update clerk_response only" ON public.reviews FOR UPDATE USING (auth.uid() = reviewee_id);
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── DISPUTES ──
CREATE POLICY "Users can view their own disputes" ON public.disputes FOR SELECT USING (auth.uid() = raised_by OR auth.uid() = raised_against);
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = raised_by);
CREATE POLICY "Admins can manage all disputes" ON public.disputes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── STRIKES ──
CREATE POLICY "Clerks can view their own strikes" ON public.strikes FOR SELECT USING (auth.uid() = clerk_id);
CREATE POLICY "Admins can manage all strikes" ON public.strikes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── CLERK_INCIDENTS ──
CREATE POLICY "Clerks can view their own incidents" ON public.clerk_incidents FOR SELECT USING (auth.uid() = clerk_id);
CREATE POLICY "Admins can manage all clerk incidents" ON public.clerk_incidents FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── CLERK_INVITATIONS ──
CREATE POLICY "Providers can view their invitations" ON public.clerk_invitations FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Providers can create invitations" ON public.clerk_invitations FOR INSERT WITH CHECK (auth.uid() = provider_id AND has_role(auth.uid(), 'provider'));
CREATE POLICY "Providers can update their invitations" ON public.clerk_invitations FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Users can accept invitations" ON public.clerk_invitations FOR UPDATE USING (status = 'pending' AND expires_at > now()) WITH CHECK (status = 'accepted');
CREATE POLICY "Admins can view all invitations" ON public.clerk_invitations FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ── EMAIL_LOGS ──
CREATE POLICY "Admins can view all email logs" ON public.email_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ── PLATFORM_SETTINGS ──
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── PROPERTY_CHANGE_LOGS ──
CREATE POLICY "Admins can view all change logs" ON public.property_change_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view change logs for their properties" ON public.property_change_logs FOR SELECT USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_change_logs.property_id AND properties.client_id = auth.uid()));
CREATE POLICY "Clients can insert change logs for their properties" ON public.property_change_logs FOR INSERT WITH CHECK (auth.uid() = changed_by AND EXISTS (SELECT 1 FROM properties WHERE properties.id = property_change_logs.property_id AND properties.client_id = auth.uid()));
CREATE POLICY "Clerks can view change logs for their job properties" ON public.property_change_logs FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.property_id = property_change_logs.property_id AND jobs.clerk_id = auth.uid()));
CREATE POLICY "Org members can view org property change logs" ON public.property_change_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_change_logs.property_id AND p.organisation_id IS NOT NULL AND p.organisation_id = get_user_org_id(auth.uid())));

-- ── WAITLIST_LEADS ──
CREATE POLICY "Anyone can submit waitlist lead" ON public.waitlist_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage waitlist leads" ON public.waitlist_leads FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── XERO_CONNECTIONS ──
CREATE POLICY "Users can insert their own xero connections" ON public.xero_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own xero connections" ON public.xero_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own xero connections" ON public.xero_connections FOR DELETE USING (auth.uid() = user_id);
