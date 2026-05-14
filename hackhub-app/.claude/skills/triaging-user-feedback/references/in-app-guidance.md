# In-App Guidance Feedback

## When to use
Apply when triaging feedback about tooltips, help text, placeholder copy, instructional overlays, or users asking "how do I do X?" in support channels.

## Patterns

**Quick win — placeholder or helper text missing**
Mantine inputs accept a `description` prop and `placeholder` prop. Adding these to an existing form field in `src/pages/` or `src/components/` is a single-line change. No logic, no service layer.

**Quick win — icon-only button is unclear**
If a button has no label and users don't know what it does, add a Mantine `<Tooltip label="...">` wrapper. Find icon-only buttons with `grep -r "ActionIcon" src/components/ --include="*.tsx" -l` and check for missing `title` or `Tooltip`.

**Backlog — contextual walkthrough or coach marks**
Step-by-step tours need a new component, state to track step index, and persistence so the tour doesn't repeat. Scope includes a new Zustand key or Supabase user-preferences column. Tag backlog; open question: per-hackathon or one-time global tour?

## Pitfalls
Don't add inline help text that duplicates what the field label already says — it adds noise. Guidance copy should answer "why" or "what format", not restate the label.