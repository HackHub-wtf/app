# Content & Copy

## When to use
When auditing or rewriting user-facing strings across components and pages — headings, labels, empty states, tooltips, and error messages. Use when copy feels generic, passive, or misaligned with what the user is actually trying to accomplish at that moment.

## Patterns

**Outcome language over feature language**
Scan every `<Title>`, `<Text>`, and button label in `src/pages/` and `src/components/`. Replace tool-centric phrasing ("Ideas are submitted here") with outcome phrasing ("Pitch your idea to the judging panel"). The user's goal is always the frame.

**Role-aware empty states**
Empty states are the highest-leverage copy surface. A blank Teams page should not say "No teams yet." — it should say "No teams in this hackathon yet. Create one and invite collaborators." Check `src/components/` for empty-state renders and rewrite them to name the next action and its value.

**Error messages that help**
Form validation errors in React Hook Form + Zod surfaces should explain what to do, not just what went wrong. "Invalid email" → "Enter a valid email address (e.g. you@company.com)."

## Pitfall
Don't rewrite copy without reading the surrounding component's role context. A message that's perfectly worded for a manager reads as presumptuous to a participant. Always check `useAuthStore` and `src/utils/permissions.ts` before finalizing copy.