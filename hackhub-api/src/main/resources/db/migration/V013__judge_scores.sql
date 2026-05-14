-- V013 — judge scores (panel scoring, separate from community idea_scores)

CREATE TABLE judge_scores (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    idea_id      uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    judge_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    criterion_id uuid REFERENCES voting_criteria(id),
    score        int NOT NULL CHECK (score BETWEEN 1 AND 10),
    comment      text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (idea_id, judge_id, criterion_id)
);

CREATE INDEX ON judge_scores(hackathon_id);
CREATE INDEX ON judge_scores(idea_id);
CREATE INDEX ON judge_scores(judge_id);
