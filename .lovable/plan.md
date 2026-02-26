
### What’s happening right now (clear diagnosis)

You’re not seeing “Created by” and tenant details in the clerk dashboard because of **two separate workflow gaps**:

1. **Created by name is blocked by backend access rules**  
   - Clerk job detail currently tries to read the booking creator’s name from `profiles` at runtime.
   - Clerks can only read their own profile, so creator lookup returns empty.
   - Result: “Created by” is blank in header/timeline.

2. **Tenant details are fetched but intentionally hidden in UI for clerks**  
   - Tenant data query succeeds for the assigned clerk.
   - But the card render condition is currently `(role === "client" || role === "admin")`.
   - Result: tenant details never render for clerks even when data exists.

I also verified the current job (`519ccdef-...`) has:
- `created_by_user_id` populated
- `inspection_types` bundle populated
- tenant row present in `tenant_details`
So this is primarily a **visibility workflow issue**, not missing booking data.

---

### Implementation plan (full clerk workflow fix)

## 1) Stabilize creator/assigner display for all existing + new jobs

Create a backend migration to add immutable display snapshots on jobs:
- `created_by_name text`
- `assigned_by_name text`

Then:
- Backfill both from `profiles.full_name` for existing records.
- Add a trigger to auto-populate/update these names when `created_by_user_id` or `assigned_by` changes.

Why this approach:
- Avoids widening profile access (safer than opening broad profile read policies).
- Fixes existing historical jobs immediately.
- Guarantees creator/assigner labels render reliably in clerk UI without extra cross-table permission failures.

## 2) Keep write paths consistent so new jobs always carry names

Update job mutation points to pass actor IDs as today, and rely on trigger (plus optional app-level fallback write):
- `useJobs.createJob` (creator)
- `useClerkJobs.acceptJob` (self-assignment)
- `useProviderJobs.assignClerk` (actual assigner)

No pricing logic changes here.

## 3) Fix job detail data assembly for clerk view

Update `useJobDetail.ts` to:
- Prefer `job.created_by_name` and `job.assigned_by_name` from the job row.
- Keep timeline actor fields populated from those snapshot columns.
- Remove dependence on blocked cross-user profile reads for creator/assigner.
- Keep clerk profile fetch for the assigned clerk where applicable.

Outcome:
- Header shows `Created by: <name>` consistently.
- Timeline “Job Created” and “Clerk Assigned” actor lines become reliable.

## 4) Expose tenant details in clerk job detail workflow

In `JobDetailPage.tsx`:
- Change tenant card visibility to include `role === "clerk"` (for assigned jobs where policy permits).
- Preserve role-based pricing separation (clerks still only see payout, not client price/margin).

Additionally:
- Keep existing tenant card structure (name/email/phone + second tenant label).
- Add empty-state text for check-in jobs with missing tenant rows (so clerks know data was not provided yet).

## 5) Make “Created by” visible across clerk dashboard flow (not only detail)

Update clerk list/card surfaces so creator is visible before opening a job:
- `ClerkJobsList.tsx` cards
- `SwipeJobCardContent.tsx` cards (available/my jobs stack)

Display:
- `Created by: {created_by_name || "Client"}`
- Keep bundle and payout behavior unchanged.

This fulfills “entire clerk workflow” visibility (list -> open -> timeline/detail).

## 6) Preserve security boundaries while expanding clerk visibility

Do **not** broaden generic `profiles` SELECT access.
Do:
- Continue relying on existing tenant-details policy (assigned clerk only).
- Use job-snapshot name fields for creator/assigner.
- Keep client pricing hidden from clerks exactly as now.

---

### Technical details (file-by-file)

1. **New migration** (new SQL file in `supabase/migrations/`)
   - Add:
     - `jobs.created_by_name text`
     - `jobs.assigned_by_name text`
   - Backfill from `profiles` using `created_by_user_id` and `assigned_by`.
   - Add `BEFORE INSERT OR UPDATE` trigger function to populate names automatically.

2. **`src/hooks/useJobs.ts`**
   - Ensure creator flow remains explicit (`created_by_user_id` already present).
   - Optional direct write of `created_by_name` from current profile for immediate UX; trigger remains source of truth.

3. **`src/hooks/useClerkJobs.ts`**
   - Keep `assigned_by = user.id`.
   - Ensure assignment mutation is compatible with trigger (and optional `assigned_by_name` fallback write).

4. **`src/hooks/useProviderJobs.ts`**
   - Same pattern as clerk accept flow for provider/admin assignments.

5. **`src/hooks/useJobDetail.ts`**
   - Read `created_by_name` / `assigned_by_name` from job row and use in timeline/header data model.
   - Remove fragile creator/assigner profile lookups that fail under clerk permissions.

6. **`src/pages/dashboard/JobDetailPage.tsx`**
   - Show `Created by` for clerks reliably using job snapshot name.
   - Expand tenant details card visibility to clerk role.
   - Add empty-state where appropriate.

7. **`src/components/dashboard/ClerkJobsList.tsx`** and **`src/components/dashboard/SwipeJobCardContent.tsx`**
   - Add creator badge/line on clerk cards so creator is visible before entering job detail.

8. **`src/types/database.ts`**
   - Extend local `Job` typing with optional:
     - `created_by_name`
     - `assigned_by_name`
   - (Generated backend types remain auto-managed; no manual edits to generated client/types files.)

---

### Acceptance criteria (what will be true after implementation)

- Clerk can see **who created** the job in:
  - job cards
  - job detail header
  - activity timeline
- Clerk can see **tenant details** (name/email/phone) for assigned jobs.
- Existing historical jobs display creator/assigner names after backfill.
- No changes to client pricing logic, clerk payout math, or bundle calculation logic.
- No leakage of unrestricted profile data through broad policy relaxations.

---

### End-to-end validation checklist

1. Create new bundle booking as client with tenant details + notes.
2. Open same job as clerk from Available/My Jobs:
   - Creator visible on card and detail.
   - Tenant card visible with entered fields.
   - Timeline shows creator + actual assigner attribution correctly.
3. Assign job via provider/admin flow:
   - “Assigned by <actual name>” renders for clerk.
4. Open older existing jobs:
   - Creator and assigner names now visible from backfill.
5. Confirm no regression:
   - Clerk still cannot see client pricing/margin.
   - Existing booking and payout flows unchanged.
