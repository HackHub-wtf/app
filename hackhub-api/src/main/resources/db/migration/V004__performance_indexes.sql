-- V004 — Performance indexes
-- Foreign key columns and high-cardinality filter columns used by the app layer.
-- Postgres does NOT auto-create indexes on FK columns.

-- ── organizations ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id
    ON organization_members (organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
    ON organization_members (user_id);

-- ── hackathons ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hackathons_status
    ON hackathons (status);

CREATE INDEX IF NOT EXISTS idx_hackathons_org_id
    ON hackathons (organization_id);

CREATE INDEX IF NOT EXISTS idx_hackathons_created_at_desc
    ON hackathons (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hackathons_registration_key
    ON hackathons (registration_key);   -- already UNIQUE but explicit idx helps planner

-- ── teams ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teams_hackathon_id
    ON teams (hackathon_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id
    ON team_members (team_id);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id
    ON team_members (user_id);

-- ── ideas ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ideas_hackathon_id
    ON ideas (hackathon_id);

CREATE INDEX IF NOT EXISTS idx_ideas_team_id
    ON ideas (team_id);

CREATE INDEX IF NOT EXISTS idx_ideas_created_by
    ON ideas (created_by);

CREATE INDEX IF NOT EXISTS idx_ideas_created_at_desc
    ON ideas (created_at DESC);

-- ── idea_votes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_idea_votes_idea_id
    ON idea_votes (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_votes_user_idea
    ON idea_votes (user_id, idea_id);   -- toggle-vote lookup

-- ── comments ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comments_idea_id
    ON comments (idea_id);

CREATE INDEX IF NOT EXISTS idx_comments_created_at_asc
    ON comments (idea_id, created_at ASC);

-- ── idea_scores ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_idea_scores_idea_id
    ON idea_scores (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_scores_user_criteria
    ON idea_scores (user_id, criteria_id);

-- ── voting_criteria ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_voting_criteria_hackathon_id
    ON voting_criteria (hackathon_id);

-- ── chat_messages ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id
    ON chat_messages (team_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_team_created
    ON chat_messages (team_id, created_at DESC);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications (user_id);

-- NOTE: column is "read" here; V006 renames it to "is_read"
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications (user_id, read);

-- ── refresh_tokens ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash
    ON refresh_tokens (token_hash);   -- login/refresh lookup path
