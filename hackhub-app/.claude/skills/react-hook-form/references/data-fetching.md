# Forms + Data Fetching

## When to use
Use these patterns when form submission triggers a TanStack Query mutation or when form default values come from a query result.

### Submit via `useMutation`
```typescript
const createTeam = useMutation({
  mutationFn: (data: FormValues) => TeamService.createTeam(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    reset()
  },
  onError: (err) => {
    setError('root', { message: err instanceof Error ? err.message : 'Failed' })
  }
})

const onSubmit = (data: FormValues) => createTeam.mutate(data)
```

### Populate edit form from query
```typescript
const { data: team } = useQuery({ queryKey: ['team', id], queryFn: () => TeamService.get(id) })

useEffect(() => {
  if (team) reset({ name: team.name, hackathonId: team.hackathon_id })
}, [team, reset])
```

### Loading state — prefer `isSubmitting` over `isPending`
```typescript
// isSubmitting covers the full handleSubmit async duration
<Button type="submit" loading={isSubmitting}>Save</Button>
```

## Pitfalls
- Don't use both `isSubmitting` and `mutation.isPending` for the same button — they can briefly diverge. Stick to `isSubmitting` on the submit button.