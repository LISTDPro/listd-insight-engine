

## Refactor: Centralise Clerk Payout Logic

### Current State

- `src/utils/clerkPricing.ts` holds clerk payout arrays but does **not** differentiate by tier for inventory/checkout (currently flat per size regardless of tier)
- `src/utils/pricing.ts` holds client pricing (tiered) -- this file is **not touched**
- `useJobs.ts` calls `getClerkPayout()` at job creation but only passes base pay (no add-ons)
- `calculateAbortedVisitPayout()` only uses 50% of base, ignoring add-ons
- No `clerk_payout_breakdown` column exists in the `jobs` table
- No bundle decomposition is stored

### Changes

---

#### 1. Database Migration

Add two new JSONB columns to the `jobs` table:

- `clerk_payout_breakdown` (jsonb, default `'{}'`) -- stores `{ base, addOns: [...], addOnsTotal, tier, size, inspectionType }`
- `clerk_payout_log` (jsonb, default `'[]'`) -- append-only log of payout modifications with timestamp and reason

No other table changes. No RLS changes needed (these columns inherit existing job policies).

---

#### 2. Rewrite `src/utils/clerkPricing.ts`

Replace the separate arrays with a single master configuration object:

```text
CLERK_PAYOUT_CONFIG = {
  new_inventory: {
    flex:     [25, 30, 35, 40, 45, 55, 75, 85, 95, 110],
    core:     [25, 30, 35, 40, 45, 55, 75, 85, 95, 110],
    priority: [25, 30, 35, 40, 45, 55, 75, 85, 95, 110],
  },
  check_out: {
    flex:     [25, 30, 35, 40, 45, 50, 65, 75, 85, 100],
    core:     [25, 30, 35, 40, 45, 50, 65, 75, 85, 100],
    priority: [25, 30, 35, 40, 45, 50, 65, 75, 85, 100],
  },
  check_in:  { flex: 20, core: 20, priority: 20 },   // flat
  interim:   { flex: 25, core: 25, priority: 25 },   // flat
  mid_term:  { flex: 25, core: 25, priority: 25 },   // flat
}
```

The existing values are preserved exactly. The tier dimension is added structurally so that if you later want different clerk pay per tier, you only change one object. Today all tiers share the same values.

Update `CLERK_ADD_ON_PRICES`:
- `heavilyFurnished`: change from `15` to `5` (per your spec)
- All other values remain the same

Key behaviour changes:
- `getClerkPayout(inspectionType, propertyType, tier?)` -- now accepts optional tier, **throws an error** if size/type lookup fails instead of returning 0
- `getFullClerkPayout()` -- returns the same shape but also includes `tier` and `inspectionType` in the result for storage
- `calculateAbortedVisitPayout()` -- now uses `(base + addOnsTotal) / 2` instead of just `base / 2`
- New `calculateBundleClerkPayout()` -- accepts an array of inspection types, returns per-service breakdown and total

All existing exports remain; no function signatures break. The error-on-missing-match is the only behavioural change.

---

#### 3. Update `src/hooks/useJobs.ts` -- `createJob()`

Currently only stores `clerk_payout` (base only, no add-ons). Will be updated to:

1. Call `getFullClerkPayout(inspectionType, propertyType, property, tier)` to get base + add-ons
2. Store `clerk_payout` = total (base + add-ons)
3. Store `clerk_final_payout` = total
4. Store `clerk_payout_breakdown` = full breakdown JSON (base, addOns array, tier, size, inspectionType)
5. Store `margin` = clientPrice - total
6. If lookup fails (error thrown), abort job creation and return error -- no silent £0 fallback

The `createJob` input type will gain an optional `property` field (full Property object) to enable add-on calculation.

---

#### 4. Update `src/hooks/useJobs.ts` -- `updateJob()`

When size, tier, or property details change:

1. Recalculate clerk payout via `getFullClerkPayout()`
2. Update `clerk_payout`, `clerk_final_payout`, `clerk_payout_breakdown`, `margin`
3. Append to `clerk_payout_log` with `{ timestamp, reason: "job_edited", previous, new }`
4. If clerk is assigned, trigger notification (existing notification trigger handles this)

---

#### 5. Aborted Visit Handling

Update `calculateAbortedVisitPayout()` to accept the full property so it can include add-ons:

```
abortedPayout = Math.round((base + addOnsTotal) * 0.5 * 100) / 100
```

Store result in `clerk_payout` and `clerk_final_payout`. Log in `clerk_payout_log`.

---

#### 6. Bundle Support

New function `calculateBundleClerkPayout(inspectionTypes[], propertyType, property, tier)`:

- Loops each inspection type
- Calls `getFullClerkPayout()` for each
- Returns `{ services: [{ type, base, addOns, total }], grandTotal }`
- Stored in `clerk_payout_breakdown` as the full array

---

#### 7. Update Tests (`src/test/pricing.test.ts`)

- Update existing clerk payout tests to pass tier parameter
- Add test: invalid property type throws error
- Add test: aborted visit = (base + addOns) / 2
- Add test: bundle decomposition returns correct total
- Add test: heavily furnished add-on = £5

---

#### Files Modified

| File | Change |
|---|---|
| `supabase/migrations/...` | Add `clerk_payout_breakdown` and `clerk_payout_log` columns |
| `src/utils/clerkPricing.ts` | Full rewrite with master config, tier support, error throwing, bundle function |
| `src/hooks/useJobs.ts` | Pass full property to payout calc, store breakdown, log edits |
| `src/test/pricing.test.ts` | Updated and new tests |

#### Files NOT Modified

- `src/utils/pricing.ts` (client pricing -- untouched)
- All UI components (no display changes)
- All booking flow components
- Admin payout controls (reads stored values, unaffected)

