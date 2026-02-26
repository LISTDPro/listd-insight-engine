
## Fix Clerk Dashboard Workflow & Pricing

### 1. Database Schema Update
- Add `assigned_by` (uuid) column to `jobs` table to track who assigned the clerk (Admin, Provider, or Self).
- This enables the timeline to show "Assigned by [Name]" instead of generic or incorrect attribution.

### 2. Job Creation & Pricing Logic (The Root Cause)
- **Problem**: `createJob` currently calculates clerk payout based *only* on the primary service type (e.g., "Check In"), ignoring bundled services (e.g., "New Inventory") which are only stored as text in `special_instructions`.
- **Fix**: Update `useJobs.ts` -> `createJob` to accept an array of `inspectionTypes`.
- **Implementation**:
  - If multiple types are selected, use `calculateBundleClerkPayout()` to generate the correct total payout and breakdown.
  - Store the full bundle breakdown in `clerk_payout_breakdown`.
  - Update `BookJob.tsx` to pass the full array of selected services to the backend hook.

### 3. Clerk Dashboard UI Updates
- **Job Detail Panel**: Update `ClerkJobDetailPanel.tsx` to check `clerk_payout_breakdown`.
  - If it's a bundle, display "Bundle: [Service 1] + [Service 2]" in the Service Type field.
  - Show the "Included Areas" and scope for *all* bundled services.
- **Timeline**: Update `useJobDetail.ts` to fetch the profile of the `assigned_by` user.
  - Display "Assigned by [Actual Name]" in the timeline events.

### 4. Assignment Workflow Fixes
- Update `useProviderJobs.ts` (`assignClerk`) to set `assigned_by` to the current user's ID.
- Update `useClerkJobs.ts` (`acceptJob`) to set `assigned_by` to the clerk's own ID (Self-assigned).

### 5. Data Correction for Existing Jobs
- Add a **"Fix Bundle Payouts"** tool in the Admin Dashboard (Payouts tab).
- This tool will:
  1. Scan active jobs for "Additional services:" markers in `special_instructions`.
  2. Parse the missing services.
  3. Recalculate the correct payout using the new bundle logic.
  4. Update the database with the corrected `clerk_payout` and breakdown.

### 6. Technical Details
- **Migration**: `ALTER TABLE jobs ADD COLUMN assigned_by uuid REFERENCES auth.users(id);`
- **Pricing**: Reuse existing `calculateBundleClerkPayout` from `src/utils/clerkPricing.ts`.
- **Safety**: Payout recalculation will be an explicit admin action, not an automatic background script, to prevent accidental financial changes without review.

