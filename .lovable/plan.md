

## Trustpilot Widget Integration

Add Trustpilot review widget support alongside the existing Google Reviews section -- admin-configurable, same "Real Data Only" policy.

---

### Changes

**1. `index.html` -- Add Trustpilot bootstrap script**

Insert the Trustpilot widget bootstrap script in the `<head>`:
```html
<script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async></script>
```

**2. Database migration -- Add Trustpilot platform settings rows**

Insert new `platform_settings` rows:
- `trustpilot_enabled` (default `"false"`)
- `trustpilot_embed_code` (default `""`)
- `trustpilot_review_link` (default `""`)

No new tables -- reuses the existing key-value `platform_settings` table.

**3. `src/hooks/usePlatformSettings.ts` -- Add Trustpilot fields**

Add to the `PlatformSettings` interface and `DEFAULT_SETTINGS`:
- `trustpilot_enabled: string` (default `"false"`)
- `trustpilot_embed_code: string` (default `""`)
- `trustpilot_review_link: string` (default `""`)

**4. `src/components/admin/PlatformSettingsPanel.tsx` -- Trustpilot admin section**

Add a new card after the Google Reviews section with:
- Toggle: "Display Trustpilot on site"
- Input: Trustpilot profile URL (for "Leave a review" link)
- Textarea: Trustpilot widget embed code (the `<div class="trustpilot-widget" ...>` HTML)
- Same save pattern as Google Reviews

**5. `src/components/landing/GoogleReviews.tsx` -- Add Trustpilot widget below Google**

After the Google Reviews embed/empty-state area, conditionally render a Trustpilot section if `trustpilot_enabled === "true"` and `trustpilot_embed_code` is non-empty. Renders via `dangerouslySetInnerHTML` (same pattern as Google embed). Includes a Trustpilot logo/icon and optional "Leave a review" link.

---

### Files Changed

| File | Change |
|------|--------|
| `index.html` | Add Trustpilot bootstrap `<script>` in `<head>` |
| Migration SQL | Insert 3 new `platform_settings` rows |
| `src/hooks/usePlatformSettings.ts` | Add 3 Trustpilot fields to interface and defaults |
| `src/components/admin/PlatformSettingsPanel.tsx` | Add Trustpilot admin card |
| `src/components/landing/GoogleReviews.tsx` | Render Trustpilot widget section when enabled |

### What stays unchanged

- Google Reviews logic, rating display, embed rendering
- Social proof badge in dashboard sidebar
- Review email automation
- All booking, pricing, org, and notification systems

