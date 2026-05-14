# Routing State Patterns

## When to use
Use router state to pass transient data between pages (e.g. redirect origin). Use search params for persistent, shareable filter/sort state.

**Post-login redirect with location state**
```typescript
// Redirect to login, preserve origin
<Navigate to="/login" state={{ from: location }} replace />

// In Login page — read origin and navigate back
function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const handleLogin = async (creds: LoginInput) => {
    await login(creds.email, creds.password)
    navigate(from, { replace: true })
  }
}
```

**Persistent filter state via search params**
```typescript
const [params, setParams] = useSearchParams()

function setStatus(status: string) {
  setParams(prev => { prev.set('status', status); return prev })
}
```

**Auth state from Zustand — not router state**
```typescript
// Read session from store, not from router
const { user } = useAuthStore()
```

## Pitfalls
- Router `state` is lost on hard refresh — don't rely on it for anything critical.
- Don't duplicate auth state into router state; `useAuthStore` is the single source of truth.