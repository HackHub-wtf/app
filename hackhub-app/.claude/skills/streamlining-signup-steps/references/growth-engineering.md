# Growth Engineering

## When to use
When building mechanics that increase signup volume or improve activation rate through product changes rather than copy or design alone.

## Patterns

**Progressive profile completion** — show a completion prompt (Mantine `Progress` or stepper) on the dashboard after signup. Users who see their profile is "40% complete" are more likely to return and finish. Defer this entirely from the signup gate.

**Social proof at the gate** — surface a count of active hackathons or recent signups near the signup form. Mantine's `Badge` with a live count from a public Supabase query (no auth required) adds credibility without requiring user data.

**Frictionless re-entry** — implement magic link login (`supabase.auth.signInWithOtp`) as a fallback for users who forget passwords. Fewer reset-flow abandonments means higher reactivation of dormant signups.

## Pitfalls
Do not gate the "Browse hackathons" view behind auth. Users who can see real content before signing up convert at higher rates. Use Supabase RLS to expose read-only public data without requiring a session.