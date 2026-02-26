

## Plan: Property size auto-sync, notes visibility, and enhanced job cards

### Issues identified

1. **Property size not auto-filling**: When a client selects property size/furnishing in Step 3 (Size), the PropertyForm dialog in Step 4 (Property) does NOT pre-populate with those selections. The `PropertySelector` and `PropertyForm` components don't receive `selectedSize` or `selectedFurnishing` from BookJob. The `handleCreateProperty` override (line 137-139) only applies AFTER form submission, not during form rendering.

2. **Notes not visible to clerks**: Property notes and job special instructions are partially shown. `ClerkJobDetailPanel` doesn't display `special_instructions` or property `notes` at all — only `SwipeJobCardContent` shows special instructions (truncated).

3. **Job cards need more visible info**: Clerk job cards in the list view (My Jobs/Today) lack payout, furnished status, and property type visibility.

### Changes

**1. `src/pages/BookJob.tsx`**
- Pass `selectedSize` and `selectedFurnishing` to `PropertySelector` so the form can pre-fill.

**2. `src/components/booking/PropertySelector.tsx`**
- Accept `defaultSize` and `defaultFurnishing` props, pass them to `PropertyForm` as `initialData` overrides so the form opens with the correct size/furnishing pre-selected.

**3. `src/components/dashboard/ClerkJobDetailPanel.tsx`**
- Add a "Client Notes" card showing:
  - `special_instructions` (cleaned of internal `[Additional services: ...]` and `[Service tier: ...]` tags)
  - Property `notes` (e.g. access instructions, parking details)
- Display both in a readable format with appropriate icons.

**4. `src/components/dashboard/ClerkJobsList.tsx`**
- Enhance job cards (My Jobs + Today tabs) to show:
  - Property type label (e.g. "2 Bed")
  - Furnished status
  - Clerk payout amount
  - Tier badge (already on some cards but missing from others)
- Make cards more information-dense without clutter.

**5. `src/components/dashboard/SwipeJobCardContent.tsx`**
- Add furnished status display alongside property type.
- Show property notes if available.

### Technical notes

- The `handleCreateProperty` in BookJob already overrides `property_type` and `furnished_status` on submit (lines 137-139), but the form itself starts with defaults. Fix: pass initial overrides so the form renders with correct values.
- Special instructions contain embedded metadata tags (`[Additional services: ...]`, `[Service tier: ...]`). A small helper will strip these before displaying to clerks, showing only the human-written notes.

