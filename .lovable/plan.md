

## Add Payout Breakdown to Clerk Job Detail

### Current state
The clerk payout section in `ClerkJobDetailPanel.tsx` (lines 213-219) shows a single "Your Payout: £X.XX" box with no breakdown. The data for a detailed breakdown already exists in `clerk_payout_breakdown` stored on the job row -- it contains per-service `type`, `base`, `addOnsTotal`, and `total` when it's a bundle, or a single service result otherwise.

### What changes

**File: `src/components/dashboard/ClerkJobDetailPanel.tsx`**

Replace the simple payout box (lines 213-219) with a detailed breakdown card:

- **For bundles** (breakdown.bundle === true with services array):
  - Show each service on its own line: e.g. "New Inventory — £35.00", "Check-In — £20.00"
  - If any service has add-ons, show them indented below that service line
  - Separator line, then **Total: £55.00** in bold

- **For single services** (non-bundle):
  - Parse breakdown for `base` and `addOnsTotal`
  - If add-ons exist, show "Base — £X" then each add-on line, then total
  - If no add-ons, show just the single total as today (no regression)

- **Fallback**: If no breakdown JSON exists (legacy jobs), show the current simple "Your Payout: £X.XX" display unchanged

The `INSPECTION_TYPE_LABELS` map already imported will be used to render human-readable service names.

### Technical detail

The `clerk_payout_breakdown` JSON has two shapes:

```text
Bundle:  { bundle: true, services: [{ type, base, addOns[], addOnsTotal, total }, ...], grandTotal, tier, size }
Single:  { base, addOns: [], addOnsTotal, total, tier, size, inspectionType }
```

A helper function `parsePayoutBreakdownLines()` will extract an array of `{ label, amount }` line items plus a total from either shape, keeping the render logic clean.

No pricing logic changes. No new database queries. Pure UI enhancement reading existing stored data.

