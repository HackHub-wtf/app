# Growth Engineering

## When to use
When a feature release is also a growth lever — increasing activation, retention, or expansion within a hackathon cohort.

## Patterns

**Identify the activation moment.** For HackHub features, activation usually means a manager configured the feature OR a participant used it for the first time in an active hackathon. Read the service file to find the first write operation (e.g., `votingService.ts` `createCriteria()`) — that's the activation event worth tracking.

**Surface the feature at the right step.** New capabilities buried in settings don't get adopted. Check whether the feature is reachable from the main page flow in `src/App.tsx` routing and `src/components/Layout/Sidebar.tsx` navigation. If it requires navigating more than two levels deep, flag it in the rollout notes as a discoverability risk.

**Cohort the impact.** HackHub usage is bursty — most activity happens during active hackathon windows. Frame growth impact in terms of hackathons-per-month that will benefit, not raw user counts, since a single hackathon event can drive hundreds of sessions in 48 hours.

## Pitfalls
Don't ship a growth-critical feature without confirming the empty state is handled. A participant who lands on a blank voting page with no criteria configured will bounce. Check that `src/components/` has a non-empty default state or placeholder for the new feature.