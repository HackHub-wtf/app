# React Router Components

## When to use
Prefer `<Link>` and `<NavLink>` over `<a>` tags for any in-app navigation. Use `<Navigate>` for declarative redirects.

**`<Link>` — standard navigation**
```typescript
import { Link } from 'react-router-dom'

<Link to={`/hackathons/${id}`}>View hackathon</Link>
```

**`<NavLink>` + Mantine — active link styling**
```typescript
import { NavLink } from 'react-router-dom'
import { NavLink as MantineNavLink } from '@mantine/core'

<NavLink to="/hackathons">
  {({ isActive }) => (
    <MantineNavLink label="Hackathons" active={isActive} leftSection={<IconTrophy />} />
  )}
</NavLink>
```

**`<Navigate>` — redirect inside render**
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
```

## Pitfalls
- Always use `replace` on auth redirects so the login page doesn't end up in browser history.
- `<NavLink>` renders an `<a>` — wrap with Mantine's render-prop pattern rather than nesting components directly.