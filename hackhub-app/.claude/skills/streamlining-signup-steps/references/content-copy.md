# Content Copy

## When to use
When writing button labels, error messages, field labels, and empty states in signup and activation UI.

## Patterns

**Action-first button labels** — use "Create account" or "Join HackHub" instead of "Submit" or "Register". The label should describe what happens next, not what the user is doing.

**Inline error copy** — errors should say what to fix, not what went wrong. Prefer "Use 8 or more characters" over "Password too short". Wire via React Hook Form's `errors` object and surface below the field, not in a toast.

**Onboarding prompt copy** — after signup, the first screen should explain what the user can do, not ask for more data. Example: "Pick a hackathon to join — you can update your profile any time."

## Pitfalls
Avoid placeholder text as the only label. Placeholders disappear on focus and fail accessibility checks. Always pair a visible `<label>` with every input using Mantine's `TextInput` `label` prop.