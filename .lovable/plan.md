

## Save Trustpilot Widget Embed Code

No code changes needed. This is a data update to store your Trustpilot widget embed code and enable it on the site.

### Actions

1. **Update `trustpilot_embed_code`** with the Review Collector widget HTML you provided
2. **Update `trustpilot_review_link`** to `https://uk.trustpilot.com/review/listd.co.uk` (extracted from the widget)
3. **Set `trustpilot_enabled`** to `"true"` so it renders on the landing page

All three updates go into the existing `platform_settings` rows — no schema or code changes required. The Trustpilot bootstrap script is already in `index.html`, and the `GoogleReviews.tsx` component already conditionally renders the Trustpilot section when enabled.

