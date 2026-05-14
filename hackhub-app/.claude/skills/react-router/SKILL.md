---
name: react-router
description: Implements client-side routing and navigation with React Router 7.x in the HackHub React/TypeScript application
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# React Router Skill

Handles client-side routing and navigation for HackHub using React Router 7.x (`react-router-dom`). Routes are defined in `src/App.tsx` and page components live in `src/pages/`. All routing integrates with Supabase auth state from `src/store/authStore.ts` to guard protected routes.

## Quick Start

```typescript
// Route definition in App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/hackathons" element={<ProtectedRoute><Hackathons /></ProtectedRoute>} />
    <Route path="/hackathons/:id" element={<ProtectedRoute><HackathonDetail /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

## Key Concepts

**Route params** — use `useParams<{ id: string }>()` to extract typed URL parameters.

**Navigation** — use `useNavigate()` for programmatic navigation; prefer `<Link>` for declarative links.

**Protected routes** — wrap authenticated pages in a guard component that reads from `useAuthStore` and redirects to `/login` if no user session exists.

**Location state** — pass state through navigation with `navigate('/login', { state: { from: location } })` and read it back with `useLocation()` for post-login redirects.

**Search params** — use `useSearchParams()` for filter/query state that should survive page refresh (e.g., hackathon filters).

## Common Patterns

**Protected route guard**
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
```

**Typed route params**
```typescript
function HackathonDetail() {
  const { id } = useParams<{ id: string }>()
  const { data } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonService.getById(id!)
  })
}
```

**Post-login redirect**
```typescript
function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const handleLogin = async (credentials: LoginInput) => {
    await login(credentials.email, credentials.password)
    navigate(from, { replace: true })
  }
}
```

**Programmatic navigation after mutation**
```typescript
const navigate = useNavigate()
const createTeam = useMutation({
  mutationFn: TeamService.createTeam,
  onSuccess: (team) => navigate(`/teams/${team.id}`)
})
```

**Active link styling with Mantine**
```typescript
import { NavLink } from 'react-router-dom'
import { NavLink as MantineNavLink } from '@mantine/core'

<NavLink to="/hackathons">
  {({ isActive }) => (
    <MantineNavLink label="Hackathons" active={isActive} />
  )}
</NavLink>
```