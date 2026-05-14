# Forms and Navigation

## When to use
Use React Hook Form for form state. Trigger navigation in `onSuccess` callbacks, not inside the form submit handler directly.

**Form submit → create → navigate**
```typescript
function NewTeamForm() {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm<CreateTeamInput>()

  const create = useMutation({
    mutationFn: TeamService.createTeam,
    onSuccess: (team) => navigate(`/teams/${team.id}`)
  })

  return (
    <form onSubmit={handleSubmit((data) => create.mutate(data))}>
      <TextInput {...register('name')} label="Team name" required />
      <Button type="submit" loading={create.isPending}>Create</Button>
    </form>
  )
}
```

**Pre-fill form from route param**
```typescript
function EditHackathon() {
  const { id } = useParams<{ id: string }>()
  const { data } = useQuery({ queryKey: ['hackathon', id], queryFn: () => hackathonService.getById(id!) })
  const { reset, register } = useForm<HackathonInput>()

  useEffect(() => { if (data) reset(data) }, [data, reset])
}
```

## Pitfalls
- Don't call `navigate` inside `handleSubmit` before awaiting the mutation — the route changes before the request finishes. Use `onSuccess` instead.
- Zod schemas should validate before mutation fires; invalid data should never reach the service layer.