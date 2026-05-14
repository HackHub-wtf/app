# Engagement & Adoption Feedback

## When to use
Apply when triaging feedback about features users ignore, actions they abandon mid-flow, or requests to make existing workflows more discoverable (voting, chat, file sharing, video calls).

## Patterns

**Quick win — surfacing a hidden action**
If users don't find the vote button or chat panel, the fix is often a UI label, tooltip, or icon swap inside the relevant component (`src/components/FlexibleVotingInterface.tsx`, `src/components/TeamChat.tsx`). Confirm with `grep -r "IconThumbUp\|vote" src/components/ --include="*.tsx"`.

**Quick win — loading state missing on slow action**
Mutation feedback (spinner, disabled button) is handled at the `useMutation` call site. Add `isPending` from the mutation result to disable the submit button and show a `<Loader size="xs" />`. Single-file change.

**Backlog — nudge users toward underused features**
Notification-based nudges require `notificationService.ts` logic, a trigger condition (e.g., team has no ideas after 24h), and a Supabase scheduled function or edge function. Always backlog; note the trigger source as an open question.

## Pitfalls
Adoption feedback often masks a discoverability problem, not a missing feature. Before adding new UI, grep for the existing component — it may already exist and just needs better placement or labeling.