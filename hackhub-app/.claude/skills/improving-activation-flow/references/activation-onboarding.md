# Activation & Onboarding

## When to use
When reducing drop-off between signup and first meaningful action — profile completion, hackathon registration, team join, or idea submission.

## Patterns

**Guard critical path pages against unresolved auth**
```typescript
const { user, loading } = useAuthStore()
const navigate = useNavigate()

useEffect(() => {
  if (!loading && !user) navigate('/login', { replace: true })
}, [user, loading, navigate])

if (loading) return <ActivationSkeleton />
```

**Collect minimum data at signup — defer optional fields**
```typescript
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  // role is required for RBAC — collect here, not later
  role: z.enum(['participant', 'manager']),
})
// avatar, bio, skills → deferred to profile page after first milestone
```

**Track milestone completion to drive next-step prompts**
```typescript
function useActivationMilestones(user: User | null) {
  const hasProfile = Boolean(user?.full_name && user?.role)
  const { data: memberships } = useQuery({
    queryKey: ['memberships', user?.id],
    queryFn: () => TeamService.getMemberships(user!.id),
    enabled: Boolean(user),
  })
  return {
    hasProfile,
    hasTeam: (memberships?.length ?? 0) > 0,
  }
}
```

## Pitfalls
Do not show "complete your profile" prompts on every page — once the milestone is reached, suppress the nudge. Recheck `useActivationMilestones` after mutations, not just on mount.