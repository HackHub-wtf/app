# React Router Hooks

## When to use
Use these hooks inside any component rendered within `<BrowserRouter>` in `App.tsx`.

**`useParams` — typed route parameters**
```typescript
function HackathonDetail() {
  const { id } = useParams<{ id: string }>()
  // id is string | undefined outside the matched route
}
```

**`useNavigate` — programmatic navigation**
```typescript
function TeamCard({ team }: { team: Team }) {
  const navigate = useNavigate()
  return <Button onClick={() => navigate(`/teams/${team.id}`)}>Open</Button>
}
```

**`useLocation` + `useSearchParams` — URL-driven state**
```typescript
function HackathonList() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? 'active'
  // Survives page refresh; share as a link
}
```

## Pitfalls
- `useParams` values are always `string | undefined` — non-null assert (`id!`) only after a null check.
- Never call `useNavigate` outside the render path (e.g. in a service or Zustand action) — pass `navigate` as a callback or handle navigation in `onSuccess`.