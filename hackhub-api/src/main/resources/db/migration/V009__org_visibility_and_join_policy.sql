-- V009 — organization visibility and join policy + judge role

ALTER TABLE organizations
    ADD COLUMN visibility varchar(20) NOT NULL DEFAULT 'closed'
        CHECK (visibility IN ('open', 'closed')),
    ADD COLUMN join_policy varchar(20) NOT NULL DEFAULT 'self_register'
        CHECK (join_policy IN ('invite_only', 'self_register'));

ALTER TABLE organization_members
    DROP CONSTRAINT organization_members_role_check,
    ADD CONSTRAINT organization_members_role_check
        CHECK (role IN ('owner', 'manager', 'member', 'judge'));
