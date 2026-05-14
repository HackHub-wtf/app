# Feedback & Insights

## When to use
Score feedback-collection and insight-surfacing initiatives when the team needs structured input from hackathon participants or managers — post-event surveys, voting result summaries, idea performance dashboards.

## Patterns

**Post-event summaries** — `votingService.ts` and `ideaService.ts` already aggregate scores. A read-only summary page that queries existing data requires one new page component and zero schema changes — ideal high-impact, low-risk bet.

**In-context feedback prompts** — Mantine's `Notification` and `Modal` primitives support lightweight feedback collection. A one-question prompt ("Was this hackathon well-organized?") surfaced after event close touches `notificationService.ts` and one new Supabase insert — minimal blast radius.

**Manager analytics view** — `permissions.ts` already differentiates manager from participant roles. A gated analytics tab on the hackathon detail page, reading from existing vote and idea tables via React Query, is scoped entirely to the presentation layer.

## Pitfalls
Avoid building a bespoke feedback schema before validating demand. Use the existing `notifications` or `ideas` table structure to capture early feedback signals, and only add a dedicated table once the data model is proven. Premature schema investment creates migration debt that blocks faster bets.