

## Three New Features: Reschedule Requests, Tenant Details, and Tenant Notification

This plan adds three isolated features without modifying any existing booking logic, pricing, room presets, clerk assignment, or workflow.

---

### Feature 1: "Request Reschedule" (Client-initiated, Admin-approved)

**Database changes (migration):**

- Add new columns to `jobs` table:
  - `reschedule_requested_date` (date, nullable) -- the new date the client proposes
  - `reschedule_requested_time_slot` (text, nullable) -- proposed new time slot
  - `reschedule_requested_at` (timestamptz, nullable) -- when the request was made
  - `reschedule_status` (text, nullable, default null) -- values: `pending`, `approved`, `rejected`
  - `reschedule_resolved_by` (uuid, nullable) -- admin who approved/rejected
  - `reschedule_resolved_at` (timestamptz, nullable)

**Frontend changes:**

- **JobDetailPage.tsx**: Add a "Request Reschedule" button visible to clients when the job status is one of `published`, `accepted`, `assigned` (not completed/cancelled/in_progress+). Clicking opens a dialog with a date picker and optional time slot selector. On submit, updates the job's reschedule fields and sets `reschedule_status = 'pending'`.

- **New component: `RescheduleRequestDialog.tsx`**: Contains the date/time picker form. Calls `supabase.from('jobs').update(...)` to set the reschedule fields.

- **AdminPage.tsx (Jobs tab)**: Show a badge on jobs with `reschedule_status = 'pending'`. Add Approve/Reject buttons in the job row or detail view. On approve: update `scheduled_date` and `preferred_time_slot` to the requested values, set `reschedule_status = 'approved'`, and clear the request fields. On reject: set `reschedule_status = 'rejected'`.

- **Notifications**: On approval/rejection, insert a notification row for the client. On approval, also insert a notification for the assigned clerk (if any). Uses the existing `notifications` table and in-app notification system -- no new edge functions needed for this.

- **Timeline**: Add reschedule events to `useJobDetail.ts` timeline builder.

**Constraints preserved:**
- No pricing recalculation on reschedule
- No clerk reassignment
- Completed/paid/cancelled jobs cannot be rescheduled

---

### Feature 2: "Tenant Details" Tab on Booking Page

**Database changes (migration):**

- Create new table `tenant_details`:
  - `id` (uuid, PK, default gen_random_uuid())
  - `job_id` (uuid, not null, references jobs.id)
  - `tenant_order` (integer, not null, default 1) -- 1 = primary, 2 = secondary
  - `full_name` (text, nullable)
  - `email` (text, nullable)
  - `phone` (text, nullable)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- RLS policies:
  - Clients can insert/update/select rows where `job_id` belongs to them
  - Admins can manage all rows
  - Clerks can view rows for their assigned jobs

**Frontend changes:**

- **BookJob.tsx**: Add a new step `"tenant"` between `"date"` and `"review"` in the booking wizard steps array. This step is only shown when one of the selected inspection types is `check_in`.

- **New component: `TenantDetailsForm.tsx`**: Shows fields for Primary Tenant (Full Name required for check_in, Email, Phone) and an expandable "Add Second Tenant" section with the same fields. State is held in BookJob and saved to the `tenant_details` table after job creation (post-submit).

- **BookingSummary.tsx**: Display tenant name(s) in the review summary if provided. No pricing impact.

- **JobDetailPage.tsx**: Show a read-only "Tenant Details" card on the job detail page for clients and admins, fetching from `tenant_details` where `job_id` matches.

**Constraints preserved:**
- Required only for check_in; optional for all other types
- No impact on pricing, reports, or booking submission logic

---

### Feature 3: Basic Tenant Email Notification (Check-In Only)

**Database/backend changes:**

- **New edge function: `notify-tenant-checkin`**: Triggered after a check-in job status changes to `accepted` (confirmed). Sends a simple HTML email to the tenant email via Resend with:
  - Property address
  - Booking date
  - Job type (Check-In)
  - "What to Expect" paragraph
  - LISTD contact details (hello@listd.co.uk)

- This function is called from the admin approval flow or the existing status-change trigger. To keep it simple and avoid modifying the database trigger, it will be invoked from the frontend when the admin marks the reschedule as approved or when a clerk accepts a check-in job.

**Frontend integration:**

- In `useClerkJobs.ts` (acceptJob function) or in `AdminPage.tsx` when a check-in job reaches `accepted` status: call `supabase.functions.invoke('notify-tenant-checkin', { body: { jobId } })`.

- The edge function will look up the tenant email from `tenant_details`, property address from `properties`, and job date from `jobs`.

**Constraints preserved:**
- No calendar invites, SMS, or diary integration
- No changes to existing notification system
- Simple informational email only

---

### Technical Summary

| Change | Files |
|--------|-------|
| DB migration | New columns on `jobs`, new `tenant_details` table |
| New components | `RescheduleRequestDialog.tsx`, `TenantDetailsForm.tsx` |
| Modified pages | `BookJob.tsx` (new step), `JobDetailPage.tsx` (reschedule button + tenant card), `AdminPage.tsx` (reschedule approve/reject) |
| Modified hooks | `useJobDetail.ts` (timeline entries), `useClerkJobs.ts` (tenant notification trigger) |
| New edge function | `notify-tenant-checkin` |
| Unchanged | Pricing engine, room presets, tier logic, existing notifications, clerk assignment, report system |

