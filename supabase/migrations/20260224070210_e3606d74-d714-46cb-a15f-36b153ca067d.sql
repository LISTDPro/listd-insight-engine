
-- Drop old constraint
ALTER TABLE organisation_members
  DROP CONSTRAINT IF EXISTS organisation_members_organisation_id_user_id_key;

-- Real users: still unique per org
CREATE UNIQUE INDEX organisation_members_org_active_user_unique
  ON organisation_members (organisation_id, user_id)
  WHERE status != 'invited';

-- Invited emails: unique per org
CREATE UNIQUE INDEX organisation_members_org_invited_email_unique
  ON organisation_members (organisation_id, invited_email)
  WHERE invited_email IS NOT NULL;
