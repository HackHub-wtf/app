# Distribution

## When to use
When wiring invite links, referral entry points, or OAuth provider connections that bring users into the signup flow from external channels.

## Patterns

**Invite link pre-fill** — parse a `?invite=<token>` query param on the signup page and store it in component state or a Zustand slice before the user submits. Associate the invite after `supabase.auth.signUp()` resolves, not before.

**OAuth redirect with context** — pass a `redirectTo` option so post-OAuth users land at the correct resource:
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: { redirectTo: `${window.location.origin}/hackathons/${id}` },
})
```

**Deep-link preservation** — store the intended destination in `sessionStorage` before redirecting to login. After auth, read and navigate to it. Prevents users from losing context when following a shared link.

## Pitfalls
Do not store invite tokens in `localStorage` before auth — they persist across sessions and can leak to other users on shared devices. Use `sessionStorage` or pass as a URL param through the auth callback.