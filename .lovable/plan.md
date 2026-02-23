
## Property Details -- Safe Edits with Audit Trail and Notifications

### What This Adds

When a client edits a property, the system will:
1. Log every change in a new `property_change_logs` table (audit trail)
2. Notify admins and assigned clerks that property details changed
3. Flag if the change may impact pricing (room counts, property type, furnished status)
4. Show the change history in the Job Detail Activity Timeline

No changes to pricing engine, booking workflow, room presets, or any existing logic.

---

### Database Changes (1 migration)

**New table: `property_change_logs`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | auto-generated |
| property_id | uuid, not null | references properties |
| changed_by | uuid, not null | the user who made the edit |
| changes | jsonb, not null | object mapping field names to `{old, new}` values |
| may_affect_pricing | boolean, default false | true if room counts, property_type, or furnished_status changed |
| created_at | timestamptz, default now() | when the change was made |

RLS policies:
- Clients can insert and view logs for their own properties
- Admins can view all logs
- Clerks can view logs for properties linked to their jobs

---

### Frontend Changes

**1. `useProperties.ts` -- Enhanced `updateProperty` function**

After a successful property update, the hook will:
- Compare old vs new values to build a `changes` diff object
- Determine `may_affect_pricing` (true if any of: bedrooms, bathrooms, kitchens, living_rooms, dining_areas, utility_rooms, storage_rooms, hallways_stairs, gardens, communal_areas, property_type, furnished_status, heavily_furnished changed)
- Insert a row into `property_change_logs`
- Look up any active jobs for this property and insert notifications for assigned admins and clerks

The hook will need to store properties in a way that the old values are available for comparison. Currently `fetchProperties` already stores the full property list, so the old property can be found by ID before saving.

**2. `JobDetailPage.tsx` -- Show property edit events in timeline**

In `useJobDetail.ts`, after building the timeline, fetch `property_change_logs` for the job's property_id (created after the job was created). Add timeline entries like:
- Title: "Property Details Updated"
- Description: lists changed fields, e.g. "Bedrooms: 2 -> 3, Bathrooms: 1 -> 2"
- If `may_affect_pricing` is true, append: "This change may affect pricing -- flagged for review."
- Actor: "Client"

**3. `JobDetailPage.tsx` -- "Edit Property" button on Property Details card**

Add a pencil/edit icon button on the Property Details card (visible to clients only, for non-completed/cancelled jobs). Clicking opens the existing `PropertyForm` in a dialog, pre-filled with the current property data. On submit, calls `updateProperty` from `useProperties` and refetches the job.

**4. Notification insertion (in `useProperties.ts`)**

After logging the change, the `updateProperty` function will:
- Query `jobs` for any active jobs (status not in completed, paid, cancelled) linked to this property
- For each such job, insert a notification for all admins (queried from `user_roles` where role = admin) with title "Property Details Changed" and a message listing what changed, linking to the job
- If a clerk is assigned, insert a notification for them too
- If `may_affect_pricing` is true, the notification message will include "Pricing review may be required"

---

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Create `property_change_logs` table with RLS |
| `src/hooks/useProperties.ts` | Add diff logic, insert change log, insert notifications on update |
| `src/hooks/useJobDetail.ts` | Fetch property change logs, add to timeline |
| `src/pages/dashboard/JobDetailPage.tsx` | Add "Edit Property" button on Property Details card with dialog |

### What Stays Unchanged

- Pricing engine (no automatic recalculation)
- Room presets in PropertyForm
- Booking workflow and submission logic
- Clerk assignment logic
- All existing notifications, reports, and admin controls
