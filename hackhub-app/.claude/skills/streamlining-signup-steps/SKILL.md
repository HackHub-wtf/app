---
name: streamlining-signup-steps
description: Reduces friction in signup and trial activation flows for HackHub's React/TypeScript/Supabase stack
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Streamlining Signup Steps Skill

This skill reduces friction in HackHub's signup and trial activation flows by auditing multi-step registration forms, simplifying field requirements, deferring optional data collection, and wiring progressive disclosure patterns using React Hook Form, Zod, Mantine, and Supabase Auth.

## Quick Start

1. Locate the signup page and auth store: `src/pages/Login.tsx` (or Register), `src/store/authStore.ts`
2. Audit required fields — defer anything not needed for account creation
3. Collapse multi-step forms into the fewest screens that still meet validation needs
4. Use Supabase Auth's email/password or OAuth flow via `src/lib/supabase.ts`
5. Confirm post-signup redirect lands users at a meaningful first action, not a blank dashboard

## Key Concepts

**Minimal required fields** — collect only email + password at signup. Move name, role, organization, and preferences to a post-auth onboarding step or profile page.

**Zod schema scoping** — define a tight signup schema separate from the full profile schema:
```typescript
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

**Inline validation** — use React Hook Form's `mode: 'onBlur'` to validate fields as users leave them, not on submit. Avoids wall-of-errors on first attempt.

**Supabase Auth** — `supabase.auth.signUp()` accepts `email` and `password` only. Do not block signup on profile data that can be collected later.

**AuthStore initialization** — after signup, `authStore.initialize()` should be called so the session is hydrated before redirecting. Avoid re-fetching user data manually.

**Redirect to value** — after signup, route users to a concrete first action (joining a hackathon, creating a team) rather than an empty home screen.

## Common Patterns

**Single-screen signup with deferred profile**
```typescript
// src/pages/Signup.tsx
const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
  resolver: zodResolver(signupSchema),
  mode: 'onBlur',
})

const onSubmit = async ({ email, password }: SignupInput) => {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  navigate('/onboarding') // collect name/role here, not during signup
}
```

**Progressive onboarding step (post-auth)**
```typescript
// Collect display name after account exists — no friction at the gate
const { error } = await supabase.auth.updateUser({
  data: { display_name: name },
})
```

**Disabling submit during flight**
```typescript
<Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
  Create account
</Button>
```

**Clear error surfacing**
```typescript
{errors.email && (
  <Text c="red" size="sm">{errors.email.message}</Text>
)}
```

**OAuth shortcut (zero-field signup)**
```typescript
await supabase.auth.signInWithOAuth({ provider: 'github' })
```

Use this pattern to eliminate the form entirely for users who prefer OAuth. Wire it as a primary CTA above the email form, not buried below it.