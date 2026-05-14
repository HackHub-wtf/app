-- V003 — Row-Level Security (defense-in-depth)
-- Primary enforcement is Spring Security + service layer.
-- RLS here is a backstop: direct DB access without the app session variable is blocked.
--
-- The application sets `app.current_user_id` and `app.current_user_role` at the start
-- of each request via a JPA interceptor (see infrastructure/persistence/RlsSessionInterceptor).

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_criteria     ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- Helper: extract current user id from session variable (returns NULL if not set)
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Helper: extract current user role
CREATE OR REPLACE FUNCTION app_current_user_role()
RETURNS TEXT AS $$
    SELECT NULLIF(current_setting('app.current_user_role', TRUE), '');
$$ LANGUAGE sql STABLE;

-- ── profiles ──────────────────────────────────────────────────────────────────

CREATE POLICY pol_profiles_select ON profiles FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_profiles_insert ON profiles FOR INSERT
    WITH CHECK (TRUE);   -- registration path; application validates

CREATE POLICY pol_profiles_update ON profiles FOR UPDATE
    USING (id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── organizations ─────────────────────────────────────────────────────────────

CREATE POLICY pol_orgs_select ON organizations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
              AND user_id = app_current_user_id()
        )
        OR app_current_user_role() = 'admin'
    );

CREATE POLICY pol_orgs_insert ON organizations FOR INSERT
    WITH CHECK (created_by = app_current_user_id());

CREATE POLICY pol_orgs_update ON organizations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
              AND user_id = app_current_user_id()
              AND role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );

-- ── organization_members ──────────────────────────────────────────────────────

CREATE POLICY pol_org_members_select ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
              AND om2.user_id = app_current_user_id()
        )
        OR app_current_user_role() = 'admin'
    );

CREATE POLICY pol_org_members_insert ON organization_members FOR INSERT
    WITH CHECK (
        user_id = app_current_user_id()   -- joining self
        OR EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
              AND om2.user_id = app_current_user_id()
              AND om2.role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );

CREATE POLICY pol_org_members_delete ON organization_members FOR DELETE
    USING (
        user_id = app_current_user_id()   -- leaving self
        OR EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
              AND om2.user_id = app_current_user_id()
              AND om2.role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );

-- ── refresh_tokens ────────────────────────────────────────────────────────────

CREATE POLICY pol_refresh_tokens_select ON refresh_tokens FOR SELECT
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

CREATE POLICY pol_refresh_tokens_insert ON refresh_tokens FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

CREATE POLICY pol_refresh_tokens_update ON refresh_tokens FOR UPDATE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── hackathons ────────────────────────────────────────────────────────────────

CREATE POLICY pol_hackathons_select ON hackathons FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_hackathons_insert ON hackathons FOR INSERT
    WITH CHECK (
        created_by = app_current_user_id()
        AND app_current_user_role() IN ('admin', 'manager')
    );

CREATE POLICY pol_hackathons_update ON hackathons FOR UPDATE
    USING (
        created_by = app_current_user_id()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = hackathons.organization_id
              AND user_id = app_current_user_id()
              AND role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );

CREATE POLICY pol_hackathons_delete ON hackathons FOR DELETE
    USING (created_by = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── teams ─────────────────────────────────────────────────────────────────────

CREATE POLICY pol_teams_select ON teams FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_teams_insert ON teams FOR INSERT
    WITH CHECK (created_by = app_current_user_id());

CREATE POLICY pol_teams_update ON teams FOR UPDATE
    USING (
        created_by = app_current_user_id()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = teams.id
              AND user_id = app_current_user_id()
              AND role = 'leader'
        )
        OR app_current_user_role() = 'admin'
    );

CREATE POLICY pol_teams_delete ON teams FOR DELETE
    USING (created_by = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── team_members ──────────────────────────────────────────────────────────────

CREATE POLICY pol_team_members_select ON team_members FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_team_members_insert ON team_members FOR INSERT
    WITH CHECK (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_team_members_delete ON team_members FOR DELETE
    USING (
        user_id = app_current_user_id()
        OR EXISTS (
            SELECT 1 FROM team_members tm2
            WHERE tm2.team_id = team_members.team_id
              AND tm2.user_id = app_current_user_id()
              AND tm2.role = 'leader'
        )
        OR app_current_user_role() = 'admin'
    );

-- ── ideas ─────────────────────────────────────────────────────────────────────

CREATE POLICY pol_ideas_select ON ideas FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_ideas_insert ON ideas FOR INSERT
    WITH CHECK (created_by = app_current_user_id());

CREATE POLICY pol_ideas_update ON ideas FOR UPDATE
    USING (created_by = app_current_user_id() OR app_current_user_role() = 'admin');

CREATE POLICY pol_ideas_delete ON ideas FOR DELETE
    USING (created_by = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── idea_votes ────────────────────────────────────────────────────────────────

CREATE POLICY pol_idea_votes_select ON idea_votes FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_idea_votes_insert ON idea_votes FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

CREATE POLICY pol_idea_votes_delete ON idea_votes FOR DELETE
    USING (user_id = app_current_user_id());

-- ── comments ──────────────────────────────────────────────────────────────────

CREATE POLICY pol_comments_select ON comments FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_comments_insert ON comments FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

CREATE POLICY pol_comments_update ON comments FOR UPDATE
    USING (user_id = app_current_user_id());

-- ── voting_criteria ───────────────────────────────────────────────────────────

CREATE POLICY pol_voting_criteria_select ON voting_criteria FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_voting_criteria_all ON voting_criteria FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM hackathons
            WHERE id = voting_criteria.hackathon_id
              AND created_by = app_current_user_id()
        )
        OR app_current_user_role() = 'admin'
    );

-- ── idea_scores ───────────────────────────────────────────────────────────────

CREATE POLICY pol_idea_scores_select ON idea_scores FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

CREATE POLICY pol_idea_scores_insert ON idea_scores FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

CREATE POLICY pol_idea_scores_update ON idea_scores FOR UPDATE
    USING (user_id = app_current_user_id());

CREATE POLICY pol_idea_scores_delete ON idea_scores FOR DELETE
    USING (user_id = app_current_user_id());

-- ── chat_messages ─────────────────────────────────────────────────────────────

CREATE POLICY pol_chat_select ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = chat_messages.team_id
              AND user_id = app_current_user_id()
        )
        OR app_current_user_role() = 'admin'
    );

CREATE POLICY pol_chat_insert ON chat_messages FOR INSERT
    WITH CHECK (
        user_id = app_current_user_id()
        AND EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = chat_messages.team_id
              AND user_id = app_current_user_id()
        )
    );

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE POLICY pol_notifications_select ON notifications FOR SELECT
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

CREATE POLICY pol_notifications_insert ON notifications FOR INSERT
    WITH CHECK (TRUE);   -- application layer inserts notifications for users

CREATE POLICY pol_notifications_update ON notifications FOR UPDATE
    USING (user_id = app_current_user_id());

CREATE POLICY pol_notifications_delete ON notifications FOR DELETE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');
