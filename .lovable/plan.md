

## Problem

1. The "Mark as Completed" button only renders when `job.status === "submitted"` — a very specific state that requires the report to already be uploaded via InventoryBase. If the job is in any other status, the button is invisible.
2. When it does render, it sits in the header's `flex justify-between` row alongside navigation and status badges, making it easy to overlook — especially on mobile/tablet.

## Plan

### 1. Add a prominent clerk action card below the ClerkJobDetailPanel

Instead of relying solely on the header button, add a visible action card in the main content area for clerks. This card will:

- Show **"Mark as Completed"** when status is `submitted` (report uploaded, ready to finalise)
- Show a contextual status message for other statuses (e.g., "Awaiting report submission" for `in_progress`, "Awaiting assignment" for `accepted/assigned`)
- Be styled as a full-width card with clear call-to-action styling so it cannot be missed

### 2. Keep the existing header button as-is

The header button remains for quick access but the new card ensures discoverability.

### 3. File changes

**`src/pages/dashboard/JobDetailPage.tsx`**:
- After the `ClerkJobDetailPanel` render block (around line 447), add a new `Card` component for clerks that:
  - When `isClerkSubmittedJob` is true: shows a green action card with the "Mark as Completed" button prominently displayed, along with a brief explanation ("Report has been submitted. Mark this job as completed to notify the client.")
  - When job is `in_progress` and clerk is assigned: shows an informational card ("Report in progress — once submitted via InventoryBase, you'll be able to mark this job as completed here.")
  - When job is `accepted`/`assigned` and clerk is assigned: shows "Awaiting inspection start"

No database or backend changes needed — this is purely a UI improvement for button discoverability.

