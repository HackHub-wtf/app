-- Extend token to 64 chars (32 bytes hex) and add role + optional email
ALTER TABLE org_invitations
    ALTER COLUMN token TYPE varchar(64),
    ADD COLUMN IF NOT EXISTS invited_role varchar(20) NOT NULL DEFAULT 'member'
        CHECK (invited_role IN ('manager', 'member', 'judge')),
    ADD COLUMN IF NOT EXISTS invited_email varchar(255),
    ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
