-- V012 — final submissions per team per hackathon

CREATE TABLE final_submissions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    idea_id      uuid REFERENCES ideas(id),
    title        text NOT NULL,
    description  text,
    attachments  jsonb NOT NULL DEFAULT '[]',
    submitted_by uuid NOT NULL REFERENCES profiles(id),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (hackathon_id, team_id)
);

CREATE INDEX ON final_submissions(hackathon_id);
CREATE INDEX ON final_submissions(team_id);
