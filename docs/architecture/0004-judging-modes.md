---
adr: "0004"
title: "Hackathon Judging Modes"
status: accepted
date: "2026-05-13"
deciders:
  - Engineering Lead
  - Product Lead
---

# ADR-0004 — Hackathon Judging Modes

## 1. Context

Different hackathons need different evaluation approaches. A corporate internal hackathon may want expert panels to score submissions against weighted criteria. An open community hackathon may want democratic voting where all participants can rate ideas. Hybrid events want both signals combined.

The existing system only supported community votes (`idea_votes`) and per-criterion scores without a clear owner model (`idea_scores`). There was no way to restrict scoring to assigned judges, no way to weight panel vs community signals, and no final submission concept separate from the idea draft.

## 2. Goals / Non-Goals

**Goals:**
- Support expert panel scoring, community voting, and a weighted blend of both
- Allow organisers to configure the judging mode and blend weight per hackathon
- Separate the concept of a final submission (polished artifact) from an idea (working draft)
- Provide a single leaderboard endpoint that applies the correct formula for the mode in use

**Non-Goals:**
- Real-time score streaming during judging (scores are visible after judging closes)
- Multi-round elimination brackets
- Cross-hackathon judge profiles or certification

## 3. Proposal

Three modes, controlled by `hackathons.judging_mode`:

**`community`** — the existing vote system. All participants can upvote ideas. `communityScore` is derived from `ideas.vote_count` normalised to a 1–10 scale at query time.

**`panel`** — only users listed in `hackathon_judges` may submit scores. Scores are per-criterion (`judge_scores`), 1–10 integers. `panelScore` is the weighted average across all criteria and all judges.

**`blended`** — both signals are collected and combined:
```
blendedScore = (panelScore × panelWeight + communityScore × (100 − panelWeight)) / 100
```
`hackathons.panel_weight` is an integer 0–100 set by the organiser via `PATCH /api/v1/hackathons/{id}/config`.

Panel judges are org members explicitly assigned per hackathon via `POST /api/v1/hackathons/{hackathonId}/judging/judges`. Org membership alone does not grant judge access.

Final project submissions (`final_submissions`) are a separate concept: a team's polished deliverable (title, description, structured attachments) submitted once, distinct from the idea record that evolves throughout the hackathon.

## 4. Alternatives Considered

| Option | Pros | Cons | Why Rejected |
|---|---|---|---|
| Single scoring system with a "judge" flag on existing `idea_scores` | No schema change | Cannot weight panel vs community; no clean separation of concerns | Mixing two semantically different signals in one table makes the leaderboard query fragile |
| External judging tool (e.g. Devpost) | Feature-rich out of the box | Breaks self-hosted requirement; data leaves the platform | Against core product requirement |
| Fixed 50/50 blend | Simpler config | Organisers have strong opinions about relative weight | Adds friction without eliminating the underlying complexity |

## 5. Trade-offs and Risks

- Community score normalisation is approximate (linear scale from 0 to max votes). If one idea dominates voting, the distribution compresses other scores. This is a known approximation, not a bug.
- Judges must be explicitly assigned per hackathon. An org manager is not automatically a judge. This is intentional (separation of roles) but adds a manual step before judging can begin.
- The `panel_weight` defaults to 100 when mode is set to `panel`, and 0 when set to `community`. Organisers who switch mode mid-hackathon retain previously cast scores; the leaderboard formula changes immediately.

## 6. Impact

**FinOps:** Three new tables (`hackathon_judges`, `judge_scores`, `final_submissions`) and four new columns on `hackathons`. Storage growth is proportional to number of judges × ideas × criteria. No significant cost increase at typical hackathon scale.

**SRE:** The leaderboard summary endpoint (`GET /scores/summary`) performs an aggregation join across `judge_scores`, `idea_votes`, and `voting_criteria`. Index on `(hackathon_id, idea_id)` in `judge_scores` is required. Existing monitoring covers the endpoint.

**Security:** Judges can only score ideas in hackathons they are explicitly assigned to. RLS policies on `judge_scores` enforce `judge_id IN (SELECT user_id FROM hackathon_judges WHERE hackathon_id = ...)`. Community votes remain open to all hackathon participants.

**Team:** No frontend changes required in this iteration — the leaderboard API surface is additive. Frontend panels for judge assignment and score entry are follow-on work.

## 7. Decision

Three judging modes are supported: `panel`, `community`, and `blended`. Blended uses a per-hackathon `panel_weight` (0–100) configured by the organiser. Community score is normalised at query time from vote counts. Panel score is the weighted average of `judge_scores` entries. Only org members explicitly listed in `hackathon_judges` may submit panel scores. Final project submissions are a distinct entity from idea drafts.

Status: **Accepted**

## 8. Next Steps

- [x] V010 migration: add `judging_mode`, `panel_weight`, `visibility`, `join_policy` to `hackathons`
- [x] V011 migration: create `hackathon_judges` table + `PATCH /config` + judges API
- [x] V012 migration: create `final_submissions` table + submissions API
- [x] V013 migration: create `judge_scores` table + scores + summary API
- [ ] Frontend: judge assignment UI (org manager screen)
- [ ] Frontend: scoring panel (judge screen per hackathon)
- [ ] Frontend: leaderboard view showing blended scores
