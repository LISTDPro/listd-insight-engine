

## Fix: Allow Multiple Team Invites

### Problem
The `organisation_members` table has a unique constraint on `(organisation_id, user_id)`. Since all invited members share the same placeholder UUID `00000000-...`, the second invite to the same org fails.

### Solution

**1. Database migration**

- Drop the existing `organisation_members_organisation_id_user_id_key` unique constraint
- Add a **partial** unique index on `(organisation_id, user_id)` that excludes rows where `status = 'invited'` — this keeps real-user uniqueness intact while allowing multiple pending invites
- Add a unique index on `(organisation_id, invited_email)` where `invited_email IS NOT NULL` — prevents duplicate invites to the same email

```sql
-- Drop old constraint
ALTER TABLE organisation_members
  DROP CONSTRAINT organisation_members_organisation_id_user_id_key;

-- Real users: still unique per org
CREATE UNIQUE INDEX organisation_members_org_active_user_unique
  ON organisation_members (organisation_id, user_id)
  WHERE status != 'invited';

-- Invited emails: unique per org
CREATE UNIQUE INDEX organisation_members_org_invited_email_unique
  ON organisation_members (organisation_id, invited_email)
  WHERE invited_email IS NOT NULL;
```

**2. `src/pages/dashboard/TeamPage.tsx`**

Change the placeholder `user_id` from a hardcoded zero-UUID to `crypto.randomUUID()` so each invite row gets its own unique UUID. This is a one-line change in the `handleInvite` function.

### What stays unchanged
- All existing member records
- Owner/staff role logic
- RLS policies
- Invite email sending
- Booking, pricing, notification systems

