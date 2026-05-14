-- V010 — hackathon visibility, join policy, and judging configuration

ALTER TABLE hackathons
    ADD COLUMN visibility varchar(20) NOT NULL DEFAULT 'private'
        CHECK (visibility IN ('public', 'private')),
    ADD COLUMN join_policy varchar(20) NOT NULL DEFAULT 'self_register'
        CHECK (join_policy IN ('invite_only', 'self_register')),
    ADD COLUMN judging_mode varchar(20) NOT NULL DEFAULT 'community'
        CHECK (judging_mode IN ('panel', 'community', 'blended')),
    ADD COLUMN panel_weight int NOT NULL DEFAULT 70
        CHECK (panel_weight BETWEEN 0 AND 100);
