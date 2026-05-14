-- V001 — Core schema
-- profiles, organizations, hackathons, teams, ideas, votes, comments, chat, notifications
-- No Supabase-specific functions (auth.uid, auth.users). No RLS — handled at application layer.

-- ── Extensions ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── profiles ──────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'participant'
                    CHECK (role IN ('admin', 'manager', 'participant')),
    skills      TEXT[] NOT NULL DEFAULT '{}',
    organization_id UUID,            -- FK added after organizations table exists
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── organizations ─────────────────────────────────────────────────────────────

CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url    TEXT,
    website_url TEXT,
    created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Back-fill FK now that organizations exists
ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ── organization_members ──────────────────────────────────────────────────────

CREATE TABLE organization_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member'
                        CHECK (role IN ('owner', 'manager', 'member')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id  ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);

-- ── refresh_tokens ────────────────────────────────────────────────────────────
-- Hashed, single-use. Rotated on each refresh call.

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_hash  TEXT UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ── hackathons ────────────────────────────────────────────────────────────────

CREATE TABLE hackathons (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                 TEXT NOT NULL,
    description           TEXT NOT NULL,
    start_date            TIMESTAMPTZ NOT NULL,
    end_date              TIMESTAMPTZ NOT NULL,
    registration_key      TEXT UNIQUE NOT NULL,
    status                TEXT NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'open', 'running', 'completed')),
    max_team_size         INTEGER NOT NULL DEFAULT 4,
    allowed_participants  INTEGER NOT NULL,
    current_participants  INTEGER NOT NULL DEFAULT 0,
    created_by            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,
    banner_url            TEXT,
    rules                 TEXT,
    prizes                TEXT[] NOT NULL DEFAULT '{}',
    tags                  TEXT[] NOT NULL DEFAULT '{}',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_hackathons_updated_at
    BEFORE UPDATE ON hackathons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_hackathons_status          ON hackathons(status);
CREATE INDEX idx_hackathons_created_by      ON hackathons(created_by);
CREATE INDEX idx_hackathons_organization_id ON hackathons(organization_id);

-- ── teams ─────────────────────────────────────────────────────────────────────

CREATE TABLE teams (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    created_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_open      BOOLEAN NOT NULL DEFAULT TRUE,
    skills       TEXT[] NOT NULL DEFAULT '{}',
    avatar_url   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (name, hackathon_id)
);

CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_teams_hackathon_id ON teams(hackathon_id);
CREATE INDEX idx_teams_created_by   ON teams(created_by);

-- ── team_members ──────────────────────────────────────────────────────────────

CREATE TABLE team_members (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- ── ideas ─────────────────────────────────────────────────────────────────────

CREATE TABLE ideas (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    hackathon_id        UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id             UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category            TEXT NOT NULL DEFAULT '',
    tags                TEXT[] NOT NULL DEFAULT '{}',
    votes               INTEGER NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'submitted', 'in-progress', 'completed')),
    attachments         TEXT[] NOT NULL DEFAULT '{}',
    repository_url      TEXT,
    demo_url            TEXT,
    project_attachments JSONB,
    total_score         DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    vote_count          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_ideas_hackathon_id ON ideas(hackathon_id);
CREATE INDEX idx_ideas_team_id      ON ideas(team_id);
CREATE INDEX idx_ideas_created_by   ON ideas(created_by);
CREATE INDEX idx_ideas_status       ON ideas(status);

-- ── idea_votes ────────────────────────────────────────────────────────────────

CREATE TABLE idea_votes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id    UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (idea_id, user_id)
);

CREATE INDEX idx_idea_votes_idea_id ON idea_votes(idea_id);
CREATE INDEX idx_idea_votes_user_id ON idea_votes(user_id);

-- Auto-maintain ideas.votes count
CREATE OR REPLACE FUNCTION fn_update_idea_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ideas SET votes = votes + 1 WHERE id = NEW.idea_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ideas SET votes = votes - 1 WHERE id = OLD.idea_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_idea_vote_count
    AFTER INSERT OR DELETE ON idea_votes
    FOR EACH ROW EXECUTE FUNCTION fn_update_idea_vote_count();

-- ── comments ──────────────────────────────────────────────────────────────────

CREATE TABLE comments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id    UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_comments_idea_id ON comments(idea_id);

-- ── chat_messages ─────────────────────────────────────────────────────────────

CREATE TABLE chat_messages (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text'
                     CHECK (message_type IN ('text', 'file', 'system')),
    file_url     TEXT,
    file_name    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_team_id ON chat_messages(team_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(team_id, created_at DESC);

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'info'
                   CHECK (type IN ('info', 'success', 'warning', 'error')),
    read       BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read    ON notifications(user_id, read);
