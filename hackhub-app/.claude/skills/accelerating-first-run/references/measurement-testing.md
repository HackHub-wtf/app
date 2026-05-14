# Measurement & Testing

## When to use
When instrumenting the onboarding flow to understand where users drop off, or when running experiments to improve activation rate.

## Patterns

**Track step completion events**
Emit an analytics event every time a user completes an onboarding step. Minimum payload: `{ userId, step, timestamp, hackathonId }`. This lets you compute per-step drop-off without full session recording.

**Define a binary activation metric**
Pick one event that represents "activated" (e.g., `team_joined` or `idea_submitted`). Measure the percentage of new signups who hit this event within 48 hours. This is your primary onboarding health metric.

**A/B test empty state CTAs**
Use a simple feature flag (a `VITE_` env var or a Supabase config row) to swap empty state copy or button placement between two variants. Measure activation rate per variant over 7-day cohorts before committing.

## Pitfalls
- Don't measure onboarding success by profile completion or step views alone. Users who complete a profile form but never join a team have not activated. Track actions that prove product understanding, not form submissions.