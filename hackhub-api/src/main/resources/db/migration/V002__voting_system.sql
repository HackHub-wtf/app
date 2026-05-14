-- V002 — Flexible voting system
-- voting_criteria and idea_scores tables with weighted scoring

CREATE TABLE voting_criteria (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id  UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    weight        INTEGER NOT NULL CHECK (weight > 0 AND weight <= 100),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hackathon_id, name)
);

CREATE TRIGGER trg_voting_criteria_updated_at
    BEFORE UPDATE ON voting_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_voting_criteria_hackathon_id ON voting_criteria(hackathon_id);

CREATE TABLE idea_scores (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id     UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES voting_criteria(id) ON DELETE CASCADE,
    score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (idea_id, user_id, criteria_id)
);

CREATE TRIGGER trg_idea_scores_updated_at
    BEFORE UPDATE ON idea_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_idea_scores_idea_id ON idea_scores(idea_id);
CREATE INDEX idx_idea_scores_user_id ON idea_scores(user_id);

-- Recalculate ideas.total_score and ideas.vote_count from idea_scores
-- Called by application layer after any score insert/update/delete.
-- Kept as a DB function to allow direct psql operations during ops/debugging.
CREATE OR REPLACE FUNCTION fn_recalculate_idea_score(p_idea_id UUID)
RETURNS VOID AS $$
DECLARE
    v_hackathon_id UUID;
    v_total        DECIMAL(10,2) := 0;
    v_voters       INTEGER;
    r              RECORD;
BEGIN
    SELECT hackathon_id INTO v_hackathon_id FROM ideas WHERE id = p_idea_id;

    FOR r IN
        SELECT vc.weight, COALESCE(AVG(s.score), 0) AS avg_score
        FROM voting_criteria vc
        LEFT JOIN idea_scores s ON s.criteria_id = vc.id AND s.idea_id = p_idea_id
        WHERE vc.hackathon_id = v_hackathon_id
        GROUP BY vc.id, vc.weight
    LOOP
        v_total := v_total + (r.avg_score * r.weight / 100.0);
    END LOOP;

    SELECT COUNT(DISTINCT user_id) INTO v_voters
    FROM idea_scores WHERE idea_id = p_idea_id;

    UPDATE ideas
    SET total_score = v_total,
        vote_count  = v_voters,
        updated_at  = NOW()
    WHERE id = p_idea_id;
END;
$$ LANGUAGE plpgsql;
