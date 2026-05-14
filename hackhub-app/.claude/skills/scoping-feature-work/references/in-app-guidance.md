# In-App Guidance

## When to use
Scope this pattern for tooltips, walkthroughs, contextual help, and coach marks that orient users without leaving the app.

## Patterns

### Contextual coach marks (first-visit only)
Store "seen" state in `localStorage` via a thin Zustand slice (no Supabase column). Show Mantine `Popover` anchored to the target element.
```
Slice 1 — add useFirstVisit(key: string) hook in src/hooks/
Slice 2 — render CoachMark wrapper component around target
Slice 3 — dismiss writes key to localStorage, Zustand reacts, mark disappears
```

### Role-aware help text
Render different helper copy based on `hasRole()` from `src/utils/permissions.ts`. Scope as a UI-only slice — no migration, no service call.
```
Given user is a participant (not admin/manager)
When they view the Hackathons page
Then help text explains how to join, not how to create
And canManageTeam() === false gates creation CTA
```

### Inline validation messages
Use React Hook Form + Zod schema errors surfaced via Mantine `TextInput` `error` prop. Scope as a form slice inside an existing page component.

## Pitfalls
- Don't use `dangerouslySetInnerHTML` for help text — React Markdown handles rich content safely.
- Coach marks that fire on every visit are noise; always guard with a "seen" flag.