

## Organisation Structure, Team Management, and Notification Enhancement

This plan adds an organisation layer on top of the existing client system. All existing booking logic, pricing, room presets, workflows, and integrations remain completely unchanged.

---

### Database Changes (1 migration)

**New table: `organisations`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | gen_random_uuid() |
| name | text, not null | Organisation/company name |
| created_by | uuid, not null | The user who created it (becomes Owner) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**New table: `organisation_members`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | gen_random_uuid() |
| organisation_id | uuid, not null | FK to organisations |
| user_id | uuid, not null | FK concept (no FK to auth.users) |
| org_role | text, not null | `owner` or `staff` |
| status | text, not null, default `active` | `active`, `invited`, `disabled` |
| invited_email | text, nullable | Email used for invitation |
| invited_at | timestamptz, nullable | |
| last_active_at | timestamptz, nullable | Updated on login/dashboard load |
| created_at | timestamptz | default now() |
| UNIQUE(organisation_id, user_id) | | |

**New columns on `jobs` table:**

- `created_by_user_id` (uuid, nullable) -- who actually created this booking (for Creator Badge). Defaults to `client_id` for existing jobs.
- `organisation_id` (uuid, nullable) -- links the job to an organisation for shared visibility.

**New columns on `properties` table:**

- `organisation_id` (uuid, nullable) -- allows org-wide property visibility.

**RLS policies:**

- `organisations`: Members can view their own org. Owners can update. Admins can view all.
- `organisation_members`: Members can view members in their org. Owners can insert/update (invite, disable). Admins can manage all.
- `jobs`: Add new SELECT policy: "Org members can view org jobs" — `WHERE organisation_id IN (SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid() AND status = 'active')`. Add UPDATE policy for staff to update safe fields only (special_instructions, reschedule fields).
- `properties`: Add new SELECT policy for org members to see org properties. Staff can update safe fields (address, rooms).
- `property_change_logs`: Add SELECT policy for org members.
- `tenant_details`: Add SELECT/INSERT/UPDATE policies for org members on org jobs.

**Security definer function:**

```sql
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organisation_id FROM organisation_members
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;
```

Used in RLS policies to avoid recursion.

**Backfill trigger (on first org creation):**

When a client creates an organisation, existing jobs and properties owned by that client are backfilled with the new `organisation_id`. This is done via a database function called from the frontend after org creation.

---

### Auto-Organisation Creation

When a client first navigates to the "Team" tab (or a one-time prompt), they can name their organisation. This creates the `organisations` row, inserts themselves as `owner` in `organisation_members`, and backfills their existing jobs and properties with the `organisation_id`.

There is no forced migration — clients who never use the Team feature continue to work exactly as before (their jobs have `organisation_id = NULL` and existing RLS policies still apply).

---

### Frontend Changes

**1. Sidebar — New "Team" tab (clients only)**

Add a new nav item in `Sidebar.tsx` for `role === "client"`:

```
{ icon: Users, label: "Team", to: "/dashboard/team" }
```

Positioned after "Properties" in the sidebar. No layout changes to existing tabs.

**2. New page: `src/pages/dashboard/TeamPage.tsx`**

- If no organisation exists for the user, show a setup card: "Create Your Organisation" with a name input and "Create" button.
- Once created, display:
  - Organisation name (editable by owner)
  - Team member table: Name, Role (Owner/Staff), Email, Status (Active/Invited/Disabled), Last Active
  - "Invite User" button — opens dialog with email input, sends invite via existing `send-clerk-invite` pattern (repurposed edge function or new `send-team-invite` function)
  - "Disable" / "Re-enable" toggle per member

**3. New edge function: `send-team-invite`**

Sends an email invitation to join the organisation. When the invited user signs up and completes onboarding as a "client", they are automatically linked to the organisation via `organisation_members`. The invite flow will use a token stored in `organisation_members` (add `invite_token uuid` column).

**4. Modified: `Dashboard.tsx`**

Add routing for `/dashboard/team` to render `TeamPage`.

**5. Modified: `useJobs.ts` — Org-aware job fetching**

For clients who belong to an organisation:
- `fetchJobs` queries jobs where `organisation_id = user's org_id` (instead of only `client_id = user.id`)
- This lets all org members see all org bookings
- Falls back to `client_id = user.id` if user has no organisation

**6. Modified: `useProperties.ts` — Org-aware property fetching**

Same pattern: if user has an org, fetch properties by `organisation_id`. Otherwise, fetch by `client_id`.

**7. Modified: `useJobs.ts` — Creator tracking on job creation**

When creating a job, set `created_by_user_id = user.id` and `organisation_id = user's org_id` (if they have one).

**8. Creator Badge — `ClientJobsList.tsx` and `JobDetailPage.tsx`**

- On each job card, display "Created by: [Name]" below the property address.
- Fetch the creator's name from profiles using `created_by_user_id`.
- System-generated, read-only, visible to all org members and admin.

**9. Activity Log — Already exists**

The existing timeline in `useJobDetail.ts` already shows: Job Created, Tenant Details Updated (via property change logs), Property Details Updated, Reschedule Requested, Booking Cancelled. The creator badge and org context enhance this. The "Job Created" event will now include the creator's name as `actor`.

**10. Notification System Enhancement**

When these events occur, insert notifications for:
- **Booking Creator** (`created_by_user_id`)
- **Organisation Owner** (if different from creator)

Events that trigger notifications:
- Booking created (notify owner if creator is staff)
- Booking edited (status change, safe field edits)
- Tenant details updated
- Property details updated (already handled by existing trigger — extend to also notify booking creator)
- Reschedule requested
- Booking cancelled

This is implemented via a new database trigger on `jobs` that checks `organisation_id`, looks up the owner from `organisation_members`, and inserts notification rows. The existing `notify_clerk_on_job_update` trigger pattern is reused.

**In-app notifications** continue to use the existing `NotificationDropdown` bell icon — no changes needed there. They cannot be disabled per the requirement.

**Email notifications** respect the existing `notification_preferences` toggle. The `send-team-invite` edge function handles invite emails. Booking event emails use the existing Resend-based edge functions.

**11. Staff Permissions — `BookJob.tsx`**

Staff users (org_role = `staff`) can:
- Access `/book` to create new bookings
- See all org bookings and properties
- Edit safe fields (address, rooms) on properties
- Request reschedules

Staff users cannot:
- Access `/dashboard/team` (owner only)
- Access `/dashboard/payments` (hide from sidebar for staff)
- Modify pricing or org settings

This is enforced by:
- Sidebar filtering: hide "Team" and "Payments" for staff
- `TeamPage` checks `org_role === 'owner'` and redirects staff
- RLS policies restrict financial data

**12. Settings Page — Email toggle**

The existing notification preferences in `SettingsPage.tsx` already support email on/off toggles. In-app notifications remain always-on (remove the in-app mute toggles or make them read-only/always-on per the requirement).

---

### Files Changed Summary

| File | Change |
|------|--------|
| Migration SQL | New `organisations`, `organisation_members` tables; new columns on `jobs` and `properties`; RLS policies; `get_user_org_id` function; notification trigger |
| New: `src/pages/dashboard/TeamPage.tsx` | Team management UI |
| New: `supabase/functions/send-team-invite/index.ts` | Email invite edge function |
| `src/pages/Dashboard.tsx` | Add `/dashboard/team` route |
| `src/components/dashboard/Sidebar.tsx` | Add "Team" nav item for clients (owner only); hide Payments for staff |
| `src/hooks/useJobs.ts` | Org-aware fetching; set `created_by_user_id` and `organisation_id` on creation |
| `src/hooks/useProperties.ts` | Org-aware fetching; set `organisation_id` on creation |
| `src/hooks/useAuth.tsx` | Add `orgRole` and `organisationId` to auth context (fetched from `organisation_members`) |
| `src/components/dashboard/ClientJobsList.tsx` | Add "Created by" badge on each job card |
| `src/pages/dashboard/JobDetailPage.tsx` | Show "Created by" in job header |
| `src/hooks/useJobDetail.ts` | Include creator name in "Job Created" timeline event |
| `src/pages/dashboard/SettingsPage.tsx` | Make in-app notification toggles always-on (non-disableable) |
| `src/pages/BookJob.tsx` | Allow staff role to access booking (currently restricted to `role === "client"`) |

### What Stays Unchanged

- Pricing engine and `clerkPricing.ts`
- Room presets and `DEFAULT_ROOM_ITEMS`
- Tier logic and service tier calculations
- Clerk assignment workflow
- InventoryBase sync
- Existing booking submission logic
- Report system
- Admin controls
- Xero integration
- All existing RLS policies (new ones are additive)

