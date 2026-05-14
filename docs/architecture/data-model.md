# Data Model

Full entity-relationship diagram covering all tables in the HackHub schema. All IDs are UUIDs unless noted.

## ERD

```mermaid
erDiagram
    organizations {
        uuid id PK
        string name
        string slug
        string description
        string logo_url
        string website_url
        string visibility
        string join_policy
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    profiles {
        uuid id PK
        string email
        string name
        string role
        string avatar_url
        text[] skills
        uuid organization_id FK
        timestamp created_at
        timestamp updated_at
    }

    organization_members {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string role
        timestamp joined_at
    }

    %% role values: owner | manager | member | judge

    org_invitations {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        string token
        timestamp expires_at
        timestamp used_at
    }

    hackathons {
        uuid id PK
        string title
        text description
        string status
        uuid organization_id FK
        uuid created_by FK
        string registration_key
        int max_team_size
        int allowed_participants
        string banner_url
        text rules
        text[] prizes
        text[] tags
        string visibility
        string join_policy
        string judging_mode
        int panel_weight
        timestamp start_date
        timestamp end_date
        timestamp created_at
        timestamp updated_at
    }

    teams {
        uuid id PK
        string name
        text description
        uuid hackathon_id FK
        uuid created_by FK
        boolean is_open
        text[] skills
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    team_members {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        string role
        timestamp joined_at
    }

    ideas {
        uuid id PK
        string title
        text description
        string status
        uuid hackathon_id FK
        uuid team_id FK
        uuid created_by FK
        string category
        text[] tags
        text[] attachments
        string repository_url
        string demo_url
        float total_score
        int vote_count
        timestamp created_at
        timestamp updated_at
    }

    idea_votes {
        uuid id PK
        uuid idea_id FK
        uuid user_id FK
        timestamp created_at
    }

    idea_scores {
        uuid id PK
        uuid idea_id FK
        uuid user_id FK
        uuid criteria_id FK
        float score
        timestamp created_at
    }

    voting_criteria {
        uuid id PK
        uuid hackathon_id FK
        string name
        text description
        float weight
        int display_order
    }

    comments {
        uuid id PK
        uuid idea_id FK
        uuid user_id FK
        text content
        timestamp created_at
        timestamp updated_at
    }

    chat_messages {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        text content
        string message_type
        string file_url
        string file_name
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        string title
        string message
        string type
        boolean is_read
        timestamp created_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash
        timestamp expires_at
        boolean is_revoked
        timestamp created_at
    }

    hackathon_judges {
        uuid id PK
        uuid hackathon_id FK
        uuid user_id FK
        uuid invited_by FK
        timestamp invited_at
    }

    final_submissions {
        uuid id PK
        uuid hackathon_id FK
        uuid team_id FK
        uuid idea_id FK
        string title
        text description
        jsonb attachments
        uuid submitted_by FK
        timestamp submitted_at
        timestamp updated_at
    }

    judge_scores {
        uuid id PK
        uuid hackathon_id FK
        uuid idea_id FK
        uuid judge_id FK
        uuid criterion_id FK
        int score
        text comment
        timestamp created_at
        timestamp updated_at
    }

    organizations ||--o{ organization_members : "has"
    organizations ||--o{ org_invitations : "issues"
    organizations ||--o{ hackathons : "owns"
    profiles ||--o{ organization_members : "belongs to"
    profiles ||--o{ org_invitations : "creates"
    profiles ||--o{ hackathons : "creates"
    hackathons ||--o{ teams : "has"
    hackathons ||--o{ ideas : "has"
    hackathons ||--o{ voting_criteria : "defines"
    teams ||--o{ team_members : "has"
    teams ||--o{ ideas : "submits"
    teams ||--o{ chat_messages : "has"
    profiles ||--o{ team_members : "joins"
    profiles ||--o{ ideas : "creates"
    ideas ||--o{ idea_votes : "receives"
    ideas ||--o{ idea_scores : "receives"
    ideas ||--o{ comments : "has"
    voting_criteria ||--o{ idea_scores : "used in"
    profiles ||--o{ idea_votes : "casts"
    profiles ||--o{ idea_scores : "submits"
    profiles ||--o{ comments : "writes"
    profiles ||--o{ notifications : "receives"
    profiles ||--o{ refresh_tokens : "holds"
    hackathons ||--o{ hackathon_judges : "has judges"
    profiles ||--o{ hackathon_judges : "judging"
    hackathons ||--o{ final_submissions : "submissions"
    teams ||--o{ final_submissions : "submits"
    ideas ||--o{ judge_scores : "scored by"
    profiles ||--o{ judge_scores : "judges"
```

## Key Constraints

- `voting_criteria.weight` values for a hackathon must sum to 100. Validated in `VotingService.validateCriteriaWeights()`.
- `idea_votes` has a unique constraint on `(idea_id, user_id)` — one vote per user per idea.
- `idea_scores` has a unique constraint on `(idea_id, user_id, criteria_id)` — one score per criterion per judge per idea.
- `refresh_tokens.token_hash` stores a SHA-256 hash of the raw token; raw tokens are never persisted.
- `org_invitations.token` is a random opaque string; `used_at` is set on first use to prevent replay.
- `hackathon_judges` has a unique constraint on `(hackathon_id, user_id)` — a user may only be assigned once per hackathon.
- `judge_scores` has a unique constraint on `(hackathon_id, idea_id, judge_id, criterion_id)` — one score per criterion per judge per idea.
- `hackathons.panel_weight` is an integer in the range 0–100; enforced by a check constraint.
- `final_submissions` has a unique constraint on `(hackathon_id, team_id)` — one submission per team per hackathon.

## Status Enumerations

| Entity | Field | Values |
|---|---|---|
| `hackathons` | `status` | `draft`, `open`, `running`, `completed` |
| `hackathons` | `visibility` | `public`, `private` |
| `hackathons` | `join_policy` | `self_register`, `invite_only` |
| `hackathons` | `judging_mode` | `panel`, `community`, `blended` |
| `ideas` | `status` | `draft`, `submitted`, `in-progress`, `completed` |
| `profiles` | `role` | `admin`, `manager`, `participant` |
| `organizations` | `visibility` | `open`, `closed` |
| `organizations` | `join_policy` | `self_register`, `invite_only` |
| `organization_members` | `role` | `owner`, `manager`, `member`, `judge` |
| `team_members` | `role` | `leader`, `member` |
| `chat_messages` | `message_type` | `text`, `file`, `system` |
| `final_submissions` | `attachments[].type` | `pptx`, `video`, `youtube`, `github`, `bitbucket`, `url` |

## Judging

Each hackathon has a `judging_mode`:
- **community** — votes from all members (existing vote system)
- **panel** — scores from assigned judges only
- **blended** — weighted average: `(panel_score × panel_weight + community_score × (100 − panel_weight)) / 100`

Panel judges are stored in `hackathon_judges`. Scores per criterion are in `judge_scores`. The leaderboard summary endpoint applies the weight formula to produce a single `blendedScore` per idea.
