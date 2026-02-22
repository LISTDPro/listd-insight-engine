

## Problem

The `platform_settings` table has an RLS policy that requires authentication:

```
Policy: "All users can read platform settings"
Command: SELECT
Using: (auth.uid() IS NOT NULL)
```

This means unauthenticated visitors (landing page, footer, Google Reviews section) get an empty response, and the app falls back to hardcoded defaults in `usePlatformSettings.ts`.

The last edit corrected the fallback URLs, but the root cause remains: **admin changes to social/Google URLs in the database won't appear on the public-facing site.**

## Fix

1. **Update the RLS policy** on `platform_settings` to allow anonymous SELECT access (these are non-sensitive display settings):

```sql
DROP POLICY "All users can read platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);
```

The admin-only write policy stays unchanged, so only admins can modify settings.

2. **No frontend code changes needed** -- the `usePlatformSettings` hook already fetches from the database and merges results over the defaults. Once the RLS policy allows public reads, it will work correctly for all visitors.

## Impact

- Landing page footer (Instagram, Facebook icons)
- Google Reviews section (rating, review link, embed code)
- Dashboard sidebar social footer (already works for authenticated users)
- Any future public-facing settings

## Risk

Low. The `platform_settings` table contains only display configuration (URLs, toggle flags, embed codes) -- no sensitive data. Write access remains restricted to admins.

