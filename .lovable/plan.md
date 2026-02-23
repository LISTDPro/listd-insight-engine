

## Studio Configuration Correction and Bedroom Scope Logic

### What This Changes

When a user selects "Studio" as the property type, the room fields will auto-populate with the correct defaults. Additionally, any increase in bedrooms above 0 for a studio will correctly trigger additional scope pricing (this already works in the current pricing engine -- no pricing changes needed).

### Changes Required

**1. PropertyForm.tsx -- Auto-populate room defaults on property type change**

Add a preset map that defines default room counts per property type. When the user changes the property type selector, the room fields auto-fill with the correct values.

Studio defaults:
- Bedrooms: 0, Bathrooms: 1, Kitchens: 1, Living Rooms: 1, Dining Areas: 0

Other types (1-bed through 9-bed) will set bedrooms to match the type number, with the same base rooms (1 bathroom, 1 kitchen, 1 living room, 0 dining areas). All other room fields (hallways, utility, storage, gardens, communal) reset to 0.

The `handleChange` function for `property_type` will be enhanced to apply these presets automatically when the type changes.

**2. Scope/Pricing -- No changes needed**

The existing pricing logic already handles this correctly:
- `PropertyPricingPreview` calculates extra bedrooms as `bedrooms - propertyTypeIndex` (studio index = 0)
- So a studio with 1 bedroom = 1 extra bedroom = +GBP10 add-on
- `calculatePriceBreakdown` in pricing.ts uses the same logic
- No pricing formula, tier, or layout changes required

**3. Admin locking of fields -- Out of scope for this change**

The request mentions fields should be "locked on the agent side" and "editable in Admin only." The current PropertyForm is only used in the client booking flow. Admin property editing uses a separate flow. No changes to field editability are needed in this task since the form is client-facing and the presets simply guide correct input.

### Technical Detail

In `PropertyForm.tsx`, a new constant `PROPERTY_TYPE_PRESETS` will map each `PropertyType` to its default room counts. A new handler wrapping `property_type` changes will apply the preset values to all room fields simultaneously, replacing the current single-field `handleChange` call for the type selector.

