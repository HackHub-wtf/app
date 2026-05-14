---
name: react
description: Manages React components, hooks, and component lifecycle patterns for HackHub's React 19 + TypeScript frontend
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# React Skill

Handles React component development, custom hook creation, and lifecycle management for HackHub — a React 19 + TypeScript application using Mantine for UI, Zustand for global state, and TanStack Query for server state.

## Quick Start

```bash
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # ESLint + TypeScript checks
```

## Key Concepts

**Component structure** — PascalCase files in `src/components/`, named exports matching file name. Page-level components live in `src/pages/`.

**Hook conventions** — camelCase with `use` prefix, one hook per file in `src/hooks/`. Hooks wrap external concerns (Socket.io, Supabase subscriptions) so components stay clean.

**State split** — Zustand (`src/store/`) owns global client state (auth, hackathon context). TanStack Query owns all server state. Never duplicate server data into Zustand.

**Service layer** — Components call services (`src/services/`), never raw Supabase queries. Services are static-method classes.

**TypeScript strict mode** — enabled. No `any`. Use `unknown` at boundaries, Zod for runtime validation of external data.

## Common Patterns

**Data fetching**
```typescript
function TeamList({ hackathonId }: { hackathonId: string }) {
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return teams.map(team => <TeamCard key={team.id} team={team} />)
}
```

**Custom hook with cleanup**
```typescript
export function useRealtimeTeam(teamId: string) {
  const { socket } = useRealtime()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!socket) return
    socket.emit('join:team', { teamId })
    socket.on(`team:${teamId}:message`, (msg: Message) => {
      setMessages(prev => [...prev, msg])
    })
    return () => {
      socket.off(`team:${teamId}:message`)
      socket.emit('leave:team', { teamId })
    }
  }, [socket, teamId])

  return messages
}
```

**Optimistic mutation**
```typescript
const mutation = useMutation({
  mutationFn: (data: UpdateTeamInput) => TeamService.updateTeam(data),
  onMutate: newData => {
    queryClient.setQueryData(['teams'], (old: Team[]) =>
      old.map(t => (t.id === newData.id ? { ...t, ...newData } : t))
    )
  },
  onError: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
})
```

**Deriving state — never store what you can compute**
```typescript
const teamCount = teams.length          // derive
const adminTeams = teams.filter(...)    // derive
// do NOT: const [teamCount, setTeamCount] = useState(0)
```

**Avoid** — raw `fetch` in `useEffect` without cleanup, missing loading/error guards, `any` types, storing derived values in state.