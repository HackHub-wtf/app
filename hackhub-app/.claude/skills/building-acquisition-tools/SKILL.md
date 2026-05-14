---
name: building-acquisition-tools
description: Designs lead magnets or free tools for acquisition — builds standalone pages, widgets, or calculators that capture leads and drive signups for HackHub
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Building Acquisition Tools Skill

Designs and builds lead magnets, free tools, and acquisition widgets for HackHub using React 19, Mantine 8, React Hook Form + Zod, and Supabase. Covers standalone landing pages, embeddable calculators, gated-content flows, and email-capture forms that convert visitors into registered users.

## Quick Start

1. Identify the acquisition goal: email capture, trial signup, or feature preview
2. Read existing pages in `src/pages/` to match routing and layout patterns
3. Build the tool as a self-contained page component under `src/pages/`
4. Wire email capture to Supabase `auth.signUp` or a `leads` table insert
5. Gate the result behind a signup nudge using `useAuthStore` from `src/store/authStore.ts`

## Key Concepts

**Lead capture forms** — use React Hook Form + Zod for validation, Mantine `TextInput` / `Button` for UI, and Supabase for persistence. Always validate at the boundary with a Zod schema before writing to the database.

**Gated results** — show a preview of the tool output, then prompt unauthenticated users to sign up via `useAuthStore`. Check `user` from the store; if null, render a Mantine `Modal` or inline CTA instead of the full result.

**Standalone acquisition pages** — add a route in `src/App.tsx` that renders without the main `Layout` (no sidebar/header) so the page feels focused and distraction-free.

**Supabase lead storage** — insert captured emails into a `leads` table with RLS allowing anonymous inserts but restricting reads to admins. Use the `supabase` client from `src/lib/supabase.ts`.

**Conversion nudges** — use Mantine `Notification`, `Badge`, or `Alert` to surface social proof (e.g. "1,200 hackathons hosted") near the CTA to reduce friction.

## Common Patterns

**Email capture with Zod validation**
```typescript
const leadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(leadSchema),
})

const onSubmit = async (data: z.infer<typeof leadSchema>) => {
  await supabase.from('leads').insert(data)
  // show success state
}
```

**Gated result pattern**
```typescript
const { user } = useAuthStore()

return result && !user ? (
  <Stack>
    <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>{result}</div>
    <Button component={Link} to="/signup">Sign up to see your full report</Button>
  </Stack>
) : (
  <FullResult data={result} />
)
```

**Standalone route (no layout)**
```typescript
// In App.tsx — outside the Layout wrapper
<Route path="/tools/hackathon-planner" element={<HackathonPlannerTool />} />
```

**Supabase anonymous lead insert**
```typescript
const { error } = await supabase
  .from('leads')
  .insert({ email, name, source: 'hackathon-planner-tool' })

if (error) throw new Error(error.message)
```