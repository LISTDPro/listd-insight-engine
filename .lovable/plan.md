

## Fix: "Request Reschedule" Button Not Visible to Clients

### Root Cause

In `JobDetailPage.tsx` (line 205), the action buttons area is wrapped in a condition:

```
{(needsPreAck || needsReportAcceptance || isClerkAvailableJob || isClerkAcceptedJob || isClerkInProgressJob) && (
  <div className="flex gap-2">
    ...
    {canRequestReschedule && ( <Button>Request Reschedule</Button> )}
    ...
  </div>
)}
```

The outer condition does not include `canRequestReschedule`, so when a client views a confirmed job where pre-inspection is already acknowledged and the report hasn't been submitted yet, the entire action bar is hidden -- along with the reschedule button.

### Fix

Add `canRequestReschedule` and the pending-reschedule badge condition to the outer guard:

```
{(needsPreAck || needsReportAcceptance || isClerkAvailableJob || isClerkAcceptedJob || isClerkInProgressJob || canRequestReschedule || (job as any).reschedule_status === "pending") && (
```

This is a one-line change. No other files, logic, or layout are modified.

### What Was Already Implemented (Confirmed Working)

All three features from the original plan are already in the codebase:

1. **Request Reschedule** -- `RescheduleRequestDialog.tsx` exists, database columns are in place, admin approve/reject UI is in `JobDetailPage.tsx` (admin section). Only the visibility bug above prevents clients from seeing the button.

2. **Tenant Details** -- `TenantDetailsForm.tsx` exists, the "Tenant" step is wired into `BookJob.tsx` for check-in jobs, and tenant data is saved to the `tenant_details` table.

3. **Tenant Email Notification** -- The `notify-tenant-checkin` edge function is deployed and triggered from `useClerkJobs.ts` when a clerk accepts a check-in job.

### Files Changed

- `src/pages/dashboard/JobDetailPage.tsx` -- Add `canRequestReschedule` and reschedule-pending check to the outer rendering condition on line 205.

