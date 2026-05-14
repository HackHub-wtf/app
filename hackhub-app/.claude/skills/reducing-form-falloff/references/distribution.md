# Distribution

## When to use
Apply when deciding how to surface a form to the right user at the right moment — registration prompts, invite flows, idea submission nudges, and gated actions.

## Patterns

### Gate actions to trigger the registration form contextually
Show the signup form when an unauthenticated user tries to vote, join a team, or submit an idea rather than redirecting to a generic `/login` page.

```typescript
if (!user) {
  openModal({ children: <RegistrationForm redirectAfter={currentPath} /> })
  return
}
```

### Pre-fill invite forms from URL params
Hackathon invite links should carry a `hackathon_id` param that auto-selects the hackathon in the join form.

```typescript
const [searchParams] = useSearchParams()
const hackathonId = searchParams.get('hackathon_id') ?? ''

useForm({ defaultValues: { hackathon_id: hackathonId } })
```

### Surface the idea submission form inline, not behind a page nav
Embed `IdeaForm` in a `Modal` triggered from the ideas list so the user never loses their place in the hackathon context.

## Pitfalls
Do not redirect unauthenticated users to `/login` without preserving the intended destination. Use a `next` query param or session storage so the post-auth redirect lands them back where they started.