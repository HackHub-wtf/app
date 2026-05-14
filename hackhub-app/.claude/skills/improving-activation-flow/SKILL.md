---
name: improving-activation-flow
description: Optimizes activation steps and time-to-value milestones for HackHub — reduces friction in registration, onboarding, and first-action flows so users reach meaningful engagement faster
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Improving Activation Flow Skill

Optimizes the critical path from signup to first value in HackHub: account creation, profile setup, hackathon registration, team formation, and first idea submission. Targets friction points in `src/pages/` (Login, Hackathons, Teams, Ideas) and the auth layer (`src/store/authStore.ts`), using Mantine for UI, React Hook Form + Zod for validation, and TanStack Query for data loading.

## Quick Start

```bash
npm run dev       # http://localhost:5173 — test flows live
npm run lint      # catch type errors before committing
npm run build     # verify production bundle is clean
```

## Key Concepts

**Activation funnel** — The critical path is: signup → profile complete → join/create hackathon → join/create team → submit idea. Each step is a milestone; dropped users at any step are activation failures.

**Auth gate** — `src/store/authStore.ts` controls `user`, `loading`, and session state. Redirect unauthenticated users immediately; avoid showing blank states while session resolves.

**Progressive disclosure** — Collect only the minimum data at each step. Defer optional fields (avatar, bio, skills) to after the user has reached their first milestone.

**Optimistic UI** — Use TanStack Query mutations with `onMutate` optimistic updates for team joins and idea submissions so the UI responds instantly, not after a round-trip.

**Error surfaces** — Validation errors from Zod schemas must appear inline (field-level), not as page-level toasts. Users should not have to hunt for what went wrong.

**Loading skeletons** — Replace `isLoading` spinners on critical path pages with Mantine `Skeleton` components so layout does not shift when data arrives.

## Common Patterns

**Redirect after auth resolves**
```typescript
const { user, loading } = useAuthStore()
const navigate = useNavigate()

useEffect(() => {
  if (!loading && !user) navigate('/login', { replace: true })
}, [user, loading, navigate])

if (loading) return <ActivationSkeleton />
```

**Inline field validation with React Hook Form + Zod**
```typescript
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  hackathonId: z.string().uuid('Select a valid hackathon'),
})

const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
})

// In JSX — show error inline, not as a toast
<TextInput
  {...register('name')}
  error={errors.name?.message}
  label="Team name"
/>
```

**Optimistic team join**
```typescript
const joinTeam = useMutation({
  mutationFn: (teamId: string) => TeamService.joinTeam(teamId),
  onMutate: async (teamId) => {
    await queryClient.cancelQueries({ queryKey: ['teams', hackathonId] })
    const previous = queryClient.getQueryData<Team[]>(['teams', hackathonId])
    queryClient.setQueryData(['teams', hackathonId], (old: Team[]) =>
      old.map(t => t.id === teamId ? { ...t, isMember: true } : t)
    )
    return { previous }
  },
  onError: (_err, _teamId, ctx) => {
    queryClient.setQueryData(['teams', hackathonId], ctx?.previous)
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['teams', hackathonId] }),
})
```

**Skeleton on first load**
```typescript
const { data: hackathons, isLoading } = useQuery({
  queryKey: ['hackathons'],
  queryFn: () => HackathonService.getAll(),
})

if (isLoading) {
  return (
    <Stack>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={80} radius="md" />
      ))}
    </Stack>
  )
}
```

**Milestone completion check**
```typescript
function useActivationMilestones(user: User | null) {
  const hasProfile = Boolean(user?.full_name && user?.role)
  const { data: memberships } = useQuery({
    queryKey: ['memberships', user?.id],
    queryFn: () => TeamService.getMemberships(user!.id),
    enabled: Boolean(user),
  })
  const hasTeam = (memberships?.length ?? 0) > 0

  return { hasProfile, hasTeam }
}
```
```

The skill covers the five activation milestones specific to HackHub, with patterns for auth gating, inline validation, optimistic mutations, skeleton loading, and milestone tracking — all using the project's actual stack (Mantine, React Hook Form + Zod, TanStack Query, Zustand).