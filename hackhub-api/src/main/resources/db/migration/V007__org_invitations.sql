CREATE TABLE org_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by      UUID        NOT NULL REFERENCES profiles(id),
    token           VARCHAR(32) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_invitations_token ON org_invitations (token);
CREATE INDEX idx_org_invitations_organization_id ON org_invitations (organization_id);
