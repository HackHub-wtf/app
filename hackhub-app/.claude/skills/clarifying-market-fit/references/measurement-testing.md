# Measurement & Testing

## When to use
When defining what success looks like for a messaging or copy change — setting up event tracking, choosing the right metric, or structuring a test so the result is actually interpretable.

## Patterns

**Instrument copy changes like feature changes**
Any copy rewrite on a high-traffic surface (`src/pages/Home.tsx`, team join flow, idea submission CTA) should have a corresponding analytics event so the before/after is measurable. Use `VITE_GOOGLE_ANALYTICS_ID` or Hotjar session recording if configured.

**Choose the right conversion event**
Don't measure click rate on a CTA when the goal is activation. Define the downstream event that actually matters — "user joined a team within 24 hours of signup" is a better activation metric than "user clicked Join Team button." Align the test metric to the value narrative, not the UI interaction.

**One variable at a time**
When testing copy variants, change one element per test: the headline, or the CTA label, or the empty state — not all three simultaneously. Multiple changes make it impossible to attribute the outcome to a specific decision.

## Pitfall
Copy tests run on low-traffic pages don't reach significance in a reasonable time window. Prioritize testing on the highest-traffic surfaces first (`Home.tsx`, login/signup, the main Hackathons list) before moving to edge-case pages.