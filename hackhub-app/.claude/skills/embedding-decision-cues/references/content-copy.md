# Content & Copy

## When to use
When writing button labels, empty states, badge text, alert messages, or any in-product copy attached to a decision cue.

## Patterns

**Action-first button labels**
Prefer "Submit idea" over "Submission", "Join team" over "Team details". The verb signals forward motion and reduces hesitation at the click point.

**Loss-framing alert copy**
Surface what the user loses by waiting rather than what they gain by acting. Example: "Your team hasn't submitted yet — deadline in 4 h" outperforms "Submit before the deadline". Read team membership from `hackathonStore` and the deadline from the hackathon record to make it specific.

**Progress nudge microcopy**
Pair a `Progress` bar with one sentence explaining the benefit of completing, not the mechanics. "Teams with complete profiles get 3× more join requests" beats "Profile is 66% complete."

## Pitfalls
- Avoid "Don't miss out" — it reads as filler. Name the specific thing they would miss.
- Keep badge text under 12 characters; longer text wraps or gets truncated inside Mantine `Badge` at small sizes.