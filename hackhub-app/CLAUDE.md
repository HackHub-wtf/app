# HackHub - React Frontend Application

React 19 + TypeScript 5.8 frontend for managing hackathons. All data goes through a Spring Boot 3.3 REST API. No Supabase. No Socket.io.

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Node.js / Bun | 18+ | JavaScript execution |
| Framework | React | 19.x | Component UI |
| Language | TypeScript | 5.8.x | Strict mode |
| Build Tool | Vite | 7.x | Dev server, production bundle |
| UI Library | Mantine | 8.2.x | Components, theming |
| State | Zustand | 5.x | Global client state |
| Forms | React Hook Form + Zod | 7.x / 4.x | Validation |
| Data Fetching | TanStack Query | 5.x | Server state cache |
| Routing | React Router | 7.x | Client-side routing |
| Real-time | @stomp/stompjs + sockjs-client | — | STOMP over WebSocket |
| Icons | Tabler Icons | 3.x | Icon library |
| Code Quality | ESLint + TypeScript ESLint | 9.x / 8.x | Lint + type checks |
| Git Hooks | Husky | 9.x | Pre-commit quality checks |

## Quick Start

```bash
cd HackHub-wtf/app
npm install
cp .env.example .env.local
# Set VITE_API_BASE_URL and VITE_WS_URL in .env.local
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
npm test
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Spring Boot base URL (e.g. `http://localhost:8080`) |
| `VITE_WS_URL` | Yes | WebSocket endpoint (e.g. `http://localhost:8080/ws`) |
| `VITE_APP_NAME` | No | Display name |
| `VITE_APP_ENVIRONMENT` | No | `development` or `production` |

## Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── Layout/             # Header, Sidebar
│   ├── FlexibleVotingInterface.tsx
│   ├── MarkdownEditor.tsx
│   ├── NotificationCenter.tsx
│   ├── ProjectAttachments.tsx
│   ├── TeamChat.tsx
│   ├── TeamFileManager.tsx
│   ├── TeamVideoCall.tsx
│   └── VotingCriteriaManager.tsx
│
├── pages/                   # Route-level page components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Hackathons.tsx
│   ├── Teams.tsx
│   ├── Ideas.tsx
│   └── ...
│
├── hooks/                   # Custom React hooks
│   └── useRealtime.ts
│
├── store/                   # Zustand stores
│   ├── authStore.ts        # login/logout/signup via /api/v1/auth/*
│   └── hackathonStore.ts
│
├── services/                # Business logic + API calls
│   ├── hackathonService.ts
│   ├── teamService.ts
│   ├── ideaService.ts
│   ├── chatService.ts
│   ├── notificationService.ts
│   ├── profileService.ts
│   ├── storageService.ts
│   └── votingService.ts
│
├── contexts/
│   └── RealtimeContext.tsx  # STOMP client, subscribeToTeamChat, subscribeToHackathonUpdates
│
├── lib/
│   ├── apiClient.ts        # fetch wrapper; auto-refresh on 401; dispatches auth:session-expired
│   └── tokenStore.ts       # in-memory JWT access token (never localStorage)
│
├── utils/
│   ├── permissions.ts      # RBAC: hasRole, canManageTeam, canVote
│   └── ...
│
├── types/                   # Shared TypeScript types
├── App.tsx
└── main.tsx
```

## Auth Flow

```
POST /api/v1/auth/login → { accessToken } + Set-Cookie: refresh_token (httpOnly)
tokenStore.setAccessToken(data.accessToken)

All requests: Authorization: Bearer <accessToken>

On 401: apiClient auto-calls POST /api/v1/auth/refresh → rotates access token
         If refresh fails: dispatches CustomEvent('auth:session-expired')
```

**tokenStore** holds the access token in memory only — never written to localStorage or sessionStorage. On page reload authStore calls `initialize()` which hits `/api/v1/auth/refresh` to rehydrate from the httpOnly cookie.

## Data Fetching Pattern

All HTTP requests go through `src/lib/apiClient.ts`. Services call `apiClient`, never `fetch` directly.

```typescript
// src/services/teamService.ts
export class TeamService {
  static async getTeams(hackathonId: string): Promise<Team[]> {
    return apiClient.get(`/api/v1/hackathons/${hackathonId}/teams`)
  }
}

// In a component
function TeamList({ hackathonId }: { hackathonId: string }) {
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <Loader />
  if (error) return <Alert color="red">{error.message}</Alert>
  return teams.map(team => <TeamCard key={team.id} team={team} />)
}
```

## Real-time Pattern (STOMP)

Real-time features use STOMP over SockJS, not Socket.io. The client lives in `RealtimeContext.tsx`.

```typescript
// In a component
import { useRealtime } from '@/hooks/useRealtime'

function TeamChatPanel({ teamId }: { teamId: string }) {
  const { subscribeToTeamChat } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribeToTeamChat(teamId, (message) => {
      setMessages(prev => [...prev, message])
    })
    return unsubscribe
  }, [teamId, subscribeToTeamChat])
}
```

## Auth Store Pattern

```typescript
// src/store/authStore.ts
interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await apiClient.post('/api/v1/auth/login', { email, password })
      tokenStore.setAccessToken(data.accessToken)
      set({ user: data.user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  initialize: async () => {
    try {
      const data = await apiClient.post('/api/v1/auth/refresh')
      tokenStore.setAccessToken(data.accessToken)
      set({ user: data.user })
    } catch {
      set({ user: null })
    }
  },
}))
```

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TeamCard.tsx` |
| Hooks | camelCase + `use` prefix | `useRealtime.ts` |
| Stores | camelCase + `Store` suffix | `authStore.ts` |
| Services | camelCase + `Service` suffix | `teamService.ts` |
| Utils | camelCase, descriptive | `permissions.ts` |
| Types | `.types.ts` suffix | `user.types.ts` |

## Import Order

```typescript
// 1. React and external libraries
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Mantine
import { Card, Button, Group } from '@mantine/core'

// 3. Project absolute imports (@/)
import { useAuthStore } from '@/store/authStore'
import { TeamService } from '@/services/teamService'

// 4. Relative imports
import { formatDate } from '../utils/formatDate'

// 5. Type imports
import type { Team } from '@/types/team.types'
```

## TypeScript Rules

- Strict mode on. No `any`. No implicit types.
- Use `unknown` at external boundaries, narrow with Zod.
- Explicit return types on all exported functions.
- Derive TypeScript types from Zod schemas with `z.infer<>`.

```typescript
const teamSchema = z.object({
  name: z.string().min(1).max(100),
  hackathonId: z.string().uuid(),
})
type CreateTeamInput = z.infer<typeof teamSchema>

async function createTeam(input: CreateTeamInput): Promise<Team> {
  return TeamService.createTeam(teamSchema.parse(input))
}
```

## Testing

Tests use Vitest + jsdom. 20 tests across 3 files.

| File | What it covers |
|------|----------------|
| `src/lib/tokenStore.test.ts` | In-memory token isolation |
| `src/lib/apiClient.test.ts` | 401 auto-refresh, session-expired dispatch |
| `src/store/authStore.test.ts` | login/logout/initialize flows |

```bash
npm test           # run all tests
npm run build      # type check + bundle (fails on type errors)
npm run lint       # ESLint + TypeScript ESLint
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on http://localhost:5173 |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Vitest test suite |
| `npm run prepare` | Install Husky git hooks |

## Skill Usage Guide

| Skill | Invoke When |
|-------|-------------|
| react | React components, hooks, lifecycle |
| typescript | Type safety, strict mode |
| mantine | Mantine component library, theming |
| tanstack-query | Server state, caching |
| zustand | Zustand stores |
| react-hook-form | Form state and validation |
| zod | Schema validation, type inference |
| react-router | Routing, navigation |
| vite | Build config, bundling |
