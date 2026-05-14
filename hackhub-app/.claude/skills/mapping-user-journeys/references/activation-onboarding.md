# Activation & Onboarding

## When to use
Trace the path from first visit through successful first action (joining a hackathon, creating or joining a team) to find drop-off points before a user becomes active.

## Patterns

**Login → Home → Hackathon join**
Start at `src/pages/Login.tsx` → `authStore.login()` → redirect to `src/pages/Home.tsx` → `src/pages/Hackathons.tsx`. Check whether `hackathonStore.fetchHackathons()` is called before the user sees the list and whether an empty state is shown when no hackathons exist yet.

**First team join**
Trace `src/pages/Teams.tsx` → `TeamService.getTeams()` → join action → `TeamService.joinTeam()`. Verify `queryClient.invalidateQueries(['teams'])` fires after join so the UI reflects membership without a full reload.

**Auth state readiness**
`authStore.initialize()` must complete before any protected route renders. Check `src/main.tsx` for the call order. If a page renders before `user` is set in Zustand, role-gated UI will flash or crash.

## Pitfalls
- A redirect to `/login` with no message after a session expires silently drops users mid-onboarding; check that `ProtectedRoute` wrappers in `App.tsx` pass a `returnTo` param.
- Missing `isLoading` guard on `Hackathons.tsx` causes a blank list during the first fetch, which reads as "no hackathons available" to a new user.