# Product Analytics Infrastructure

## When to use
Reference when creating or extending `analyticsService.ts`, wiring up a new analytics provider, or ensuring events are typed and gated correctly across environments.

## Patterns

**Canonical service file**
```typescript
// src/services/analyticsService.ts
export const EVENTS = {
  HACKATHON_JOINED: 'hackathon:joined',
  TEAM_CREATED: 'team:created',
  TEAM_JOINED: 'team:joined',
  IDEA_SUBMITTED: 'idea:submitted',
  VOTE_CAST: 'vote:cast',
  CHAT_MESSAGE_SENT: 'chat:message_sent',
} as const

export type EventName = typeof EVENTS[keyof typeof EVENTS]

export interface EventProperties {
  userId: string
  hackathonId?: string
  teamId?: string
  ideaId?: string
  [key: string]: string | number | boolean | undefined
}

const IS_TRACKING_ENABLED =
  import.meta.env.PROD || import.meta.env.VITE_ANALYTICS_DEBUG === 'true'

export function track(event: EventName, properties: EventProperties): void {
  if (!IS_TRACKING_ENABLED) {
    console.debug('[analytics]', event, properties)
    return
  }
  // window.posthog?.capture(event, properties)
  // window.analytics?.track(event, properties)
}
```

**Adding a new provider**
```typescript
// Wrap the provider call so callers never import it directly
export function track(event: EventName, props: EventProperties): void {
  if (!IS_TRACKING_ENABLED) return
  window.analytics?.track(event, { ...props, app: 'hackhub' })
}
```

**Shared anonymous ID for pre-auth sessions**
```typescript
function getAnonymousId(): string {
  const key = 'anon_id'
  return localStorage.getItem(key) ?? (() => {
    const id = crypto.randomUUID()
    localStorage.setItem(key, id)
    return id
  })()
}
```

## Pitfalls
- Never import an analytics SDK directly in a component or service — always go through `analyticsService.track()`. This keeps provider swaps in one file.
- Do not send events during Vitest or Playwright runs. The `IS_TRACKING_ENABLED` gate must exclude `test` environments explicitly if your test runner sets `NODE_ENV=test`.