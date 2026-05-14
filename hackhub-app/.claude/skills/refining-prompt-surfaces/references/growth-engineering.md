# Growth Engineering

## When to use
When designing prompts that move users toward activation milestones — first team join, first idea submitted, first vote cast.

## Patterns

### Activation-linked banners
Show a persistent banner until the user completes their first key action. Tie visibility to a Supabase query result, not a local flag.

```tsx
const { data: ideas } = useQuery({
  queryKey: ['my-ideas', user?.id],
  queryFn: () => IdeaService.getUserIdeas(user!.id),
})

const hasSubmitted = (ideas?.length ?? 0) > 0
if (hasSubmitted) return null

return <Alert title="Submit your first idea">The hackathon is live — ideas are open now.</Alert>
```

### Progressive disclosure
Don't front-load all prompts. Show the team-setup nudge only after registration is complete. Show the idea-submission nudge only after the team exists. Sequence reduces overwhelm.

### Empty-state prompts as growth surfaces
Zero-state views (no teams, no ideas) are high-intent moments. An empty `Teams` page with a strong CTA converts better than a banner on a populated page.

```tsx
if (teams.length === 0) return (
  <Stack align="center" py="xl">
    <Text>No teams yet.</Text>
    <Button onClick={openCreateModal}>Create the first team</Button>
  </Stack>
)
```

## Pitfalls
- Don't use growth prompts on users who've already completed the target action — it signals the product isn't paying attention.
- Avoid chaining too many activation prompts; users who see three "do this next" banners stop reading all of them.