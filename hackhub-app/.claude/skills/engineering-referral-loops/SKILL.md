---
name: engineering-referral-loops
description: Designs referral or partner loop mechanics for HackHub's React/TypeScript/Supabase stack, including invite link generation, referral tracking, reward attribution, and loop conversion flows.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Engineering Referral Loops Skill

Designs and implements referral and partner loop mechanics for HackHub. Covers invite link generation, referral code tracking, reward attribution, conversion funnels, and the Supabase schema + RLS policies needed to persist referral state. Works within HackHub's layered architecture: Supabase for data, a dedicated service for business logic, React Query for server state, Zustand for session-scoped state, and Mantine for UI.

## Quick Start

1. Identify the loop entry point — hackathon registration, team invite, or partner onboarding.
2. Generate a referral token tied to `auth.users.id` and store it in a `referrals` table.
3. Attach the token to a shareable URL (e.g. `/join?ref=<token>`).
4. On conversion (signup or team join), write a `referral_conversions` row and credit rewards.
5. Surface referral status in the UI via a React Query hook backed by a service method.

## Key Concepts

**Referral token** — a short unique string (nanoid/uuid) stored in Supabase and appended to invite URLs. One token per referrer per campaign scope (hackathon, global, partner).

**Conversion event** — written when the referred user completes the target action (account creation, team join, idea submission). Triggers reward logic server-side via a Supabase Edge Function or database trigger.

**Reward attribution** — credits a reward (badge, extra votes, visibility boost) to the referrer once the conversion row is confirmed. Keep reward logic in a service (`referralService.ts`) so it stays testable and isolated from UI code.

**Loop mechanics** — referred users become potential referrers themselves; the loop closes when they share their own token. Track depth (referrer → referee chain) in `referral_conversions.depth` to cap viral loops and detect abuse.

**RLS policy shape** — referrers can read their own referral rows; only service-role or Edge Functions write conversion records to prevent client-side fraud.

## Common Patterns

**Service layer**
```typescript
// src/services/referralService.ts
export class ReferralService {
  static async getOrCreateToken(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('referrals')
      .select('token')
      .eq('referrer_id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data) return data.token
    const token = crypto.randomUUID().slice(0, 8)
    const { data: created, error: insertError } = await supabase
      .from('referrals')
      .insert({ referrer_id: userId, token })
      .select('token')
      .single()
    if (insertError) throw new Error(insertError.message)
    return created.token
  }

  static async resolveToken(token: string): Promise<string | null> {
    const { data } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('token', token)
      .maybeSingle()
    return data?.referrer_id ?? null
  }

  static async recordConversion(token: string, refereeId: string): Promise<void> {
    const referrerId = await ReferralService.resolveToken(token)
    if (!referrerId) return
    await supabase.from('referral_conversions').insert({
      referrer_id: referrerId,
      referee_id: refereeId,
      token,
    })
  }
}
```

**React Query hook**
```typescript
// src/hooks/useReferral.ts
export function useReferralToken(userId: string) {
  return useQuery({
    queryKey: ['referral-token', userId],
    queryFn: () => ReferralService.getOrCreateToken(userId),
    staleTime: Infinity,
  })
}

export function useReferralStats(userId: string) {
  return useQuery({
    queryKey: ['referral-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_conversions')
        .select('id, created_at, referee_id')
        .eq('referrer_id', userId)
      if (error) throw new Error(error.message)
      return data
    },
  })
}
```

**Reading the ref param on landing**
```typescript
// Inside the component that handles /join?ref=<token>
const [searchParams] = useSearchParams()
const refToken = searchParams.get('ref')

useEffect(() => {
  if (refToken) sessionStorage.setItem('referral_token', refToken)
}, [refToken])
```

**Supabase schema (migration)**
```sql
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references auth.users not null,
  token text unique not null,
  created_at timestamptz default now()
);

create table referral_conversions (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references auth.users not null,
  referee_id uuid references auth.users not null,
  token text not null,
  depth int default 1,
  created_at timestamptz default now()
);

alter table referrals enable row level security;
create policy "owner reads own referral" on referrals
  for select using (auth.uid() = referrer_id);

alter table referral_conversions enable row level security;
create policy "referrer reads own conversions" on referral_conversions
  for select using (auth.uid() = referrer_id);
```

**Mantine UI snippet — share panel**
```tsx
function ReferralPanel() {
  const { user } = useAuthStore()
  const { data: token, isLoading } = useReferralToken(user!.id)
  const { data: conversions } = useReferralStats(user!.id)
  const link = token ? `${window.location.origin}/join?ref=${token}` : ''

  return (
    <Stack gap="sm">
      <TextInput
        label="Your invite link"
        value={link}
        readOnly
        rightSection={
          <CopyButton value={link}>
            {({ copied, copy }) => (
              <ActionIcon onClick={copy} color={copied ? 'teal' : 'gray'}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            )}
          </CopyButton>
        }
      />
      <Text size="sm" c="dimmed">
        {conversions?.length ?? 0} people joined with your link
      </Text>
    </Stack>
  )
}
```