# LISTD Database Migration Guide

## Files (run in order)

| File | Description |
|------|-------------|
| `001_schema.sql` | Enums + all tables |
| `002_functions.sql` | Database functions (has_role, triggers, etc.) |
| `003_triggers.sql` | All triggers |
| `004_rls_policies.sql` | RLS enable + all policies |
| `005_storage.sql` | Storage buckets |
| `006_auth_trigger.sql` | Auth trigger for auto-creating profiles |

## Migration Steps

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your new project
3. Run each file **in order** (001 → 006)
4. **Edge Functions**: Copy all files from `supabase/functions/` to your new project and deploy with `supabase functions deploy`
5. **Secrets**: Add these secrets in your new project's Edge Function settings:
   - `RESEND_API_KEY`
   - `XERO_CLIENT_ID`
   - `XERO_CLIENT_SECRET`
   - `INVENTORYBASE_CALENDAR_KEY`
6. **Update your app**: Change `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to your new project's values
7. **Data migration**: If you need to migrate existing data, export it from the current project using the Lovable Cloud SQL runner

## Current Data Summary

| Table | Rows |
|-------|------|
| profiles | 7 |
| user_roles | 7 |
| organisations | 5 |
| organisation_members | 6 |
| jobs | 20 |
| properties | 16 |
| messages | 12 |
| notifications | 42 |
| email_logs | 76 |
| tenant_details | 22 |
| platform_settings | 10 |
| waitlist_leads | 1 |
| clerk_invitations | 3 |
| notification_preferences | 1 |
| property_change_logs | 1 |

Note: User accounts (auth.users) cannot be directly exported. Users will need to re-register on the new project, or you can use Supabase's auth admin API to recreate them.
