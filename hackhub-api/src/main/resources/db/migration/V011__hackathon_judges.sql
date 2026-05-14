-- V011 — hackathon judges table

CREATE TABLE hackathon_judges (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invited_by   uuid REFERENCES profiles(id),
    invited_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (hackathon_id, user_id)
);

CREATE INDEX ON hackathon_judges(hackathon_id);
CREATE INDEX ON hackathon_judges(user_id);
