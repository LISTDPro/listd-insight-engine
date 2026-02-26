

## Diagnosis

The tenant details card on `JobDetailPage.tsx` already has the correct role condition (line 534 includes `role === "clerk"`), and the RLS policy allows clerks to read tenant details for their assigned jobs. However, two issues remain:

1. **Silent query failure**: The tenant_details fetch in `JobDetailPage.tsx` (lines 92-101) uses `.then(({ data })` without checking for errors. If the query fails for any reason, the error is swallowed and `tenantDetails` stays as an empty array, hiding the card entirely.

2. **Missing from ClerkJobDetailPanel**: The `ClerkJobDetailPanel` component — the primary clerk view — does not display tenant details at all. Clerks see the Job Overview, Included Areas, and Tier Scope Summary cards, but no tenant information. The tenant card is only placed lower in the page layout, after admin-only sections, making it easy to miss even when it renders.

## Implementation Plan

### 1. Add tenant details directly into `ClerkJobDetailPanel.tsx`

This is the clerk's primary job view — tenant info should be right here, not buried below admin controls.

- Accept `tenantDetails` as a prop (or fetch it within the component using the `jobId`)
- Add a new "Tenant Details" card after the Job Overview card
- Show each tenant's name, email, and phone
- Show "(Second Tenant)" label for `tenant_order === 2`
- Show "No tenant details provided" empty state when the array is empty (for check-in jobs)

### 2. Pass tenant details from `JobDetailPage.tsx` to `ClerkJobDetailPanel`

- Pass `tenantDetails` state as a prop to `<ClerkJobDetailPanel>`
- Add error logging to the tenant fetch so silent failures are caught

### 3. Add error handling to tenant fetch

Update the `useEffect` at lines 92-101 to log errors:
```typescript
.then(({ data, error }) => {
  if (error) console.error("Failed to fetch tenant details:", error);
  if (data) setTenantDetails(data);
});
```

This ensures any RLS-related failures are visible in the console for debugging.

### Files to change

- **`src/components/dashboard/ClerkJobDetailPanel.tsx`**: Add tenant details card, accept `tenantDetails` prop
- **`src/pages/dashboard/JobDetailPage.tsx`**: Pass `tenantDetails` to `ClerkJobDetailPanel`, add error handling to tenant fetch

