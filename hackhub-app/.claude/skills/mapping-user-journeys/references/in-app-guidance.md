# In-App Guidance

## When to use
Identify places where users can get stuck with no explanation — silent permission blocks, empty states without calls to action, and error messages that don't say what to do next.

## Patterns

**Permission dead-ends**
Grep `src/utils/permissions.ts` for `hasRole` / `canManageTeam` / `canVote`. For each call site, check whether the component renders an explanation or silently hides the action. A hidden button with no message leaves the user unable to tell whether the feature exists at all.

**Empty state coverage**
Search page components for `data?.length === 0` or equivalent. Pages like `Teams.tsx`, `Ideas.tsx`, and `Hackathons.tsx` should render a contextual empty state with a primary action (e.g., "Create your first team") rather than a blank container.

**Form error surfacing**
Trace React Hook Form `formState.errors` usage in submission forms. Errors should be co-located with their field using Mantine `TextInput error={...}` props, not only shown in a top-level alert that disappears on re-render.

## Pitfalls
- Mantine notification toasts used for errors without field-level messages push validation feedback out of view on small screens. Reserve toasts for non-blocking confirmations; use inline errors for form validation failures.