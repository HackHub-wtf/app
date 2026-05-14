# Engagement & Adoption

## When to use
Map recurring workflows — idea submission, team chat, voting — to find friction that prevents users from returning or completing high-value actions.

## Patterns

**Idea submission loop**
`src/pages/Ideas.tsx` → `IdeaService.submitIdea()` → `queryClient.invalidateQueries(['ideas'])`. Confirm the Markdown editor (`MarkdownEditor.tsx`) renders a preview before submission and that Zod validation surfaces errors inline via React Hook Form rather than silently blocking submit.

**Voting flow**
`FlexibleVotingInterface.tsx` → `votingService.ts` → Supabase write. Check that `canVote` from `src/utils/permissions.ts` is evaluated before rendering the vote button, not after, to avoid a UI element that appears clickable but then rejects the action.

**Team chat retention**
`TeamChat.tsx` subscribes via `useSocket` to `team:{id}:message`. Verify the `socket.off` cleanup fires on unmount (when a user navigates away). Dangling listeners re-fire stale messages when the component remounts, which breaks message ordering.

## Pitfalls
- Optimistic updates in `useMutation` that are not rolled back on error leave users believing their vote or idea was saved when it wasn't. Always pair `onMutate` with `onError: () => queryClient.invalidateQueries(...)`.