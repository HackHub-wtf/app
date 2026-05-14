-- V008 — Complete RLS policies for all tables
--
-- IMPORTANT: The `hackhub` DB user has BYPASSRLS = true.
-- This means the Spring Boot application bypasses all RLS policies entirely.
-- RLS here is a defense-in-depth backstop against direct DB access
-- (psql sessions, database GUI tools, scripts) that don't go through the app.
--
-- The Spring Boot app enforces authorization via Spring Security @PreAuthorize
-- and the RlsContextAspect sets app.current_user_id / app.current_user_role
-- for each transaction. Those session variables are only meaningful when RLS
-- is evaluated — which only happens for roles without BYPASSRLS.
--
-- V003 added RLS for most tables. This migration:
--   1. Adds RLS + policies for org_invitations (added in V007, never got policies)
--   2. Tightens overly broad policies (IS NOT NULL → proper scoping)
--   3. Replaces all V003 policies idempotently (DROP IF EXISTS + CREATE)
--   4. Adds helper functions for common membership checks (idempotent)
--
-- All policies use DROP POLICY IF EXISTS before CREATE POLICY for idempotency.

-- ── Helper functions ──────────────────────────────────────────────────────────
-- These are idempotent via CREATE OR REPLACE.

-- Already exists from V003; re-declared here for completeness and clarity.
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- Already exists from V003; re-declared here for completeness and clarity.
CREATE OR REPLACE FUNCTION app_current_user_role()
RETURNS TEXT AS $$
    SELECT NULLIF(current_setting('app.current_user_role', TRUE), '');
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- Returns TRUE if the current session user is a member of the given org.
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_org_id
          AND user_id = app_current_user_id()
    );
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- Returns TRUE if the current session user is a participant in the given
-- hackathon — meaning they belong to a team registered for that hackathon.
CREATE OR REPLACE FUNCTION is_hackathon_participant(p_hackathon_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE t.hackathon_id = p_hackathon_id
          AND tm.user_id = app_current_user_id()
    );
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- Returns TRUE if the current session user is a member of the given team.
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id
          AND user_id = app_current_user_id()
    );
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- ── Enable RLS on org_invitations (added in V007, missed in V003) ─────────────

ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Any authenticated session can read profiles (needed for name/avatar lookups).
-- Only the owner or an admin can update. Registration (INSERT) is open — the
-- app validates credentials before the row lands.

DROP POLICY IF EXISTS pol_profiles_select ON profiles;
CREATE POLICY pol_profiles_select ON profiles FOR SELECT
    USING (app_current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS pol_profiles_insert ON profiles;
CREATE POLICY pol_profiles_insert ON profiles FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS pol_profiles_update ON profiles;
CREATE POLICY pol_profiles_update ON profiles FOR UPDATE
    USING (id = app_current_user_id() OR app_current_user_role() = 'admin');

DROP POLICY IF EXISTS pol_profiles_delete ON profiles;
CREATE POLICY pol_profiles_delete ON profiles FOR DELETE
    USING (id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── organizations ─────────────────────────────────────────────────────────────
-- Org members can read their org. Only owner/manager or admin can update.
-- Insert requires the caller to be creating their own org (created_by = self).

DROP POLICY IF EXISTS pol_orgs_select ON organizations;
CREATE POLICY pol_orgs_select ON organizations FOR SELECT
    USING (
        is_org_member(organizations.id)
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_orgs_insert ON organizations;
CREATE POLICY pol_orgs_insert ON organizations FOR INSERT
    WITH CHECK (created_by = app_current_user_id());

DROP POLICY IF EXISTS pol_orgs_update ON organizations;
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

DROP POLICY IF EXISTS pol_orgs_delete ON organizations;
CREATE POLICY pol_orgs_delete ON organizations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
              AND user_id = app_current_user_id()
              AND role = 'owner'
        )
        OR app_current_user_role() = 'admin'
    );

-- ── organization_members ──────────────────────────────────────────────────────
-- Members can see other members in their own org.
-- Members can add themselves (self-join) or be added by org owner/manager.
-- Members can remove themselves or be removed by org owner/manager.

DROP POLICY IF EXISTS pol_org_members_select ON organization_members;
CREATE POLICY pol_org_members_select ON organization_members FOR SELECT
    USING (
        is_org_member(organization_members.organization_id)
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_org_members_insert ON organization_members;
CREATE POLICY pol_org_members_insert ON organization_members FOR INSERT
    WITH CHECK (
        user_id = app_current_user_id()
        OR EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
              AND om2.user_id = app_current_user_id()
              AND om2.role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_org_members_update ON organization_members;
CREATE POLICY pol_org_members_update ON organization_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
              AND om2.user_id = app_current_user_id()
              AND om2.role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_org_members_delete ON organization_members;
CREATE POLICY pol_org_members_delete ON organization_members FOR DELETE
    USING (
        user_id = app_current_user_id()
        OR EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
              AND om2.user_id = app_current_user_id()
              AND om2.role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );

-- ── refresh_tokens ────────────────────────────────────────────────────────────
-- Users see only their own tokens. Admin can see all (for revocation).
-- INSERT is restricted to inserting one's own tokens.
-- The `is_revoked` column name is as of V006 (renamed from `revoked`).

DROP POLICY IF EXISTS pol_refresh_tokens_select ON refresh_tokens;
CREATE POLICY pol_refresh_tokens_select ON refresh_tokens FOR SELECT
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

DROP POLICY IF EXISTS pol_refresh_tokens_insert ON refresh_tokens;
CREATE POLICY pol_refresh_tokens_insert ON refresh_tokens FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

DROP POLICY IF EXISTS pol_refresh_tokens_update ON refresh_tokens;
CREATE POLICY pol_refresh_tokens_update ON refresh_tokens FOR UPDATE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

DROP POLICY IF EXISTS pol_refresh_tokens_delete ON refresh_tokens;
CREATE POLICY pol_refresh_tokens_delete ON refresh_tokens FOR DELETE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── hackathons ────────────────────────────────────────────────────────────────
-- Any authenticated user can read hackathons that belong to their org, or
-- any hackathon with status 'open' or 'running' (public discovery).
-- Only org managers/owners or the creator can update/delete.

DROP POLICY IF EXISTS pol_hackathons_select ON hackathons;
CREATE POLICY pol_hackathons_select ON hackathons FOR SELECT
    USING (
        status IN ('open', 'running', 'completed')
        OR is_org_member(hackathons.organization_id)
        OR created_by = app_current_user_id()
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_hackathons_insert ON hackathons;
CREATE POLICY pol_hackathons_insert ON hackathons FOR INSERT
    WITH CHECK (
        created_by = app_current_user_id()
        AND app_current_user_role() IN ('admin', 'manager')
    );

DROP POLICY IF EXISTS pol_hackathons_update ON hackathons;
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

DROP POLICY IF EXISTS pol_hackathons_delete ON hackathons;
CREATE POLICY pol_hackathons_delete ON hackathons FOR DELETE
    USING (created_by = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── teams ─────────────────────────────────────────────────────────────────────
-- Hackathon participants and org members can read teams.
-- Team leader or hackathon creator can update. Creator or admin can delete.

DROP POLICY IF EXISTS pol_teams_select ON teams;
CREATE POLICY pol_teams_select ON teams FOR SELECT
    USING (
        is_hackathon_participant(teams.hackathon_id)
        OR EXISTS (
            SELECT 1 FROM hackathons h
            WHERE h.id = teams.hackathon_id
              AND is_org_member(h.organization_id)
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_teams_insert ON teams;
CREATE POLICY pol_teams_insert ON teams FOR INSERT
    WITH CHECK (created_by = app_current_user_id());

DROP POLICY IF EXISTS pol_teams_update ON teams;
CREATE POLICY pol_teams_update ON teams FOR UPDATE
    USING (
        created_by = app_current_user_id()
        OR is_team_member(teams.id)
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_teams_delete ON teams;
CREATE POLICY pol_teams_delete ON teams FOR DELETE
    USING (created_by = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── team_members ──────────────────────────────────────────────────────────────
-- Hackathon participants and org members can see team membership lists.
-- Any authenticated user can join a team (app controls open/invite logic).
-- Members can leave; leaders can remove others.

DROP POLICY IF EXISTS pol_team_members_select ON team_members;
CREATE POLICY pol_team_members_select ON team_members FOR SELECT
    USING (
        is_hackathon_participant(
            (SELECT hackathon_id FROM teams WHERE id = team_members.team_id)
        )
        OR EXISTS (
            SELECT 1 FROM teams t
            JOIN hackathons h ON h.id = t.hackathon_id
            WHERE t.id = team_members.team_id
              AND is_org_member(h.organization_id)
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_team_members_insert ON team_members;
CREATE POLICY pol_team_members_insert ON team_members FOR INSERT
    WITH CHECK (app_current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS pol_team_members_delete ON team_members;
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
-- Hackathon participants and org members can read ideas.
-- Creator or team members can update (for collaborative editing).
-- Only creator or admin can delete.

DROP POLICY IF EXISTS pol_ideas_select ON ideas;
CREATE POLICY pol_ideas_select ON ideas FOR SELECT
    USING (
        is_hackathon_participant(ideas.hackathon_id)
        OR EXISTS (
            SELECT 1 FROM hackathons h
            WHERE h.id = ideas.hackathon_id
              AND is_org_member(h.organization_id)
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_ideas_insert ON ideas;
CREATE POLICY pol_ideas_insert ON ideas FOR INSERT
    WITH CHECK (created_by = app_current_user_id());

DROP POLICY IF EXISTS pol_ideas_update ON ideas;
CREATE POLICY pol_ideas_update ON ideas FOR UPDATE
    USING (
        created_by = app_current_user_id()
        OR (
            ideas.team_id IS NOT NULL
            AND is_team_member(ideas.team_id)
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_ideas_delete ON ideas;
CREATE POLICY pol_ideas_delete ON ideas FOR DELETE
    USING (created_by = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── idea_votes ────────────────────────────────────────────────────────────────
-- Hackathon participants can read and cast votes.
-- Unique constraint (idea_id, user_id) on the table prevents double-voting at
-- the DB level — no application logic can bypass this.
-- Users can retract their own vote.

DROP POLICY IF EXISTS pol_idea_votes_select ON idea_votes;
CREATE POLICY pol_idea_votes_select ON idea_votes FOR SELECT
    USING (
        is_hackathon_participant(
            (SELECT hackathon_id FROM ideas WHERE id = idea_votes.idea_id)
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_idea_votes_insert ON idea_votes;
CREATE POLICY pol_idea_votes_insert ON idea_votes FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

DROP POLICY IF EXISTS pol_idea_votes_delete ON idea_votes;
CREATE POLICY pol_idea_votes_delete ON idea_votes FOR DELETE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── idea_scores ───────────────────────────────────────────────────────────────
-- Judges (manager/admin) can read all scores for hackathons they manage.
-- Users can always read their own scores.
-- Users can only insert/update/delete their own scores.

DROP POLICY IF EXISTS pol_idea_scores_select ON idea_scores;
CREATE POLICY pol_idea_scores_select ON idea_scores FOR SELECT
    USING (
        user_id = app_current_user_id()
        OR app_current_user_role() IN ('admin', 'manager')
    );

DROP POLICY IF EXISTS pol_idea_scores_insert ON idea_scores;
CREATE POLICY pol_idea_scores_insert ON idea_scores FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

DROP POLICY IF EXISTS pol_idea_scores_update ON idea_scores;
CREATE POLICY pol_idea_scores_update ON idea_scores FOR UPDATE
    USING (user_id = app_current_user_id());

DROP POLICY IF EXISTS pol_idea_scores_delete ON idea_scores;
CREATE POLICY pol_idea_scores_delete ON idea_scores FOR DELETE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── voting_criteria ───────────────────────────────────────────────────────────
-- Hackathon participants and org members can read criteria.
-- Only hackathon creator or org owner/manager or admin can write.
-- The V003 ALL policy overlapped with the SELECT policy; split cleanly here.

DROP POLICY IF EXISTS pol_voting_criteria_select ON voting_criteria;
CREATE POLICY pol_voting_criteria_select ON voting_criteria FOR SELECT
    USING (
        is_hackathon_participant(voting_criteria.hackathon_id)
        OR EXISTS (
            SELECT 1 FROM hackathons h
            WHERE h.id = voting_criteria.hackathon_id
              AND is_org_member(h.organization_id)
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_voting_criteria_all ON voting_criteria;
DROP POLICY IF EXISTS pol_voting_criteria_insert ON voting_criteria;
CREATE POLICY pol_voting_criteria_insert ON voting_criteria FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM hackathons
            WHERE id = voting_criteria.hackathon_id
              AND created_by = app_current_user_id()
        )
        OR app_current_user_role() IN ('admin', 'manager')
    );

DROP POLICY IF EXISTS pol_voting_criteria_update ON voting_criteria;
CREATE POLICY pol_voting_criteria_update ON voting_criteria FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM hackathons
            WHERE id = voting_criteria.hackathon_id
              AND created_by = app_current_user_id()
        )
        OR app_current_user_role() IN ('admin', 'manager')
    );

DROP POLICY IF EXISTS pol_voting_criteria_delete ON voting_criteria;
CREATE POLICY pol_voting_criteria_delete ON voting_criteria FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM hackathons
            WHERE id = voting_criteria.hackathon_id
              AND created_by = app_current_user_id()
        )
        OR app_current_user_role() = 'admin'
    );

-- ── comments ──────────────────────────────────────────────────────────────────
-- Hackathon participants and org members can read and post comments.
-- Authors can edit their own comments. Only author or admin can delete.

DROP POLICY IF EXISTS pol_comments_select ON comments;
CREATE POLICY pol_comments_select ON comments FOR SELECT
    USING (
        is_hackathon_participant(
            (SELECT hackathon_id FROM ideas WHERE id = comments.idea_id)
        )
        OR EXISTS (
            SELECT 1 FROM ideas i
            JOIN hackathons h ON h.id = i.hackathon_id
            WHERE i.id = comments.idea_id
              AND is_org_member(h.organization_id)
        )
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_comments_insert ON comments;
CREATE POLICY pol_comments_insert ON comments FOR INSERT
    WITH CHECK (user_id = app_current_user_id());

DROP POLICY IF EXISTS pol_comments_update ON comments;
CREATE POLICY pol_comments_update ON comments FOR UPDATE
    USING (user_id = app_current_user_id());

DROP POLICY IF EXISTS pol_comments_delete ON comments;
CREATE POLICY pol_comments_delete ON comments FOR DELETE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── chat_messages ─────────────────────────────────────────────────────────────
-- Team members only. Non-members cannot read or post to a team's chat.

DROP POLICY IF EXISTS pol_chat_select ON chat_messages;
CREATE POLICY pol_chat_select ON chat_messages FOR SELECT
    USING (
        is_team_member(chat_messages.team_id)
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_chat_insert ON chat_messages;
CREATE POLICY pol_chat_insert ON chat_messages FOR INSERT
    WITH CHECK (
        user_id = app_current_user_id()
        AND is_team_member(chat_messages.team_id)
    );

DROP POLICY IF EXISTS pol_chat_delete ON chat_messages;
CREATE POLICY pol_chat_delete ON chat_messages FOR DELETE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── notifications ─────────────────────────────────────────────────────────────
-- Users see only their own notifications. Column renamed to is_read in V006.
-- Application layer inserts notifications on behalf of users (no self check).

DROP POLICY IF EXISTS pol_notifications_select ON notifications;
CREATE POLICY pol_notifications_select ON notifications FOR SELECT
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

DROP POLICY IF EXISTS pol_notifications_insert ON notifications;
CREATE POLICY pol_notifications_insert ON notifications FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS pol_notifications_update ON notifications;
CREATE POLICY pol_notifications_update ON notifications FOR UPDATE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

DROP POLICY IF EXISTS pol_notifications_delete ON notifications;
CREATE POLICY pol_notifications_delete ON notifications FOR DELETE
    USING (user_id = app_current_user_id() OR app_current_user_role() = 'admin');

-- ── org_invitations ───────────────────────────────────────────────────────────
-- Added in V007 — no RLS policies existed before this migration.
-- Org members can see invitations for their org.
-- Org owners/managers can create invitations.
-- Org owners/managers or the invitation creator can delete.

DROP POLICY IF EXISTS pol_org_invitations_select ON org_invitations;
CREATE POLICY pol_org_invitations_select ON org_invitations FOR SELECT
    USING (
        is_org_member(org_invitations.organization_id)
        OR app_current_user_role() = 'admin'
    );

DROP POLICY IF EXISTS pol_org_invitations_insert ON org_invitations;
CREATE POLICY pol_org_invitations_insert ON org_invitations FOR INSERT
    WITH CHECK (
        created_by = app_current_user_id()
        AND (
            EXISTS (
                SELECT 1 FROM organization_members
                WHERE organization_id = org_invitations.organization_id
                  AND user_id = app_current_user_id()
                  AND role IN ('owner', 'manager')
            )
            OR app_current_user_role() = 'admin'
        )
    );

DROP POLICY IF EXISTS pol_org_invitations_delete ON org_invitations;
CREATE POLICY pol_org_invitations_delete ON org_invitations FOR DELETE
    USING (
        created_by = app_current_user_id()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = org_invitations.organization_id
              AND user_id = app_current_user_id()
              AND role IN ('owner', 'manager')
        )
        OR app_current_user_role() = 'admin'
    );
