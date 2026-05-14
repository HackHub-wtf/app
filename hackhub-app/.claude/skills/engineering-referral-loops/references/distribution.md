# Distribution

## When to use
When deciding how and where referral links surface — in-app share panels, email invites, hackathon registration confirmation screens, or team onboarding flows.

## Patterns

**In-app share panel placement**
Render `<ReferralPanel />` on the user's profile page and on the post-registration confirmation screen. These are the two highest-intent moments for sharing.

**Email invite via Supabase Edge Function**
Trigger a Supabase Edge Function on `referral_conversions` insert to send a confirmation email to the referrer using Resend or SendGrid. Keep the email a single CTA — don't bundle it with a newsletter.

**Deep link construction**
Build invite URLs with `window.location.origin` at runtime so they work across environments (local, staging, production) without hardcoded domains:
```typescript
const link = `${window.location.origin}/join?ref=${token}`
```

## Pitfalls
- Don't surface the share panel inside the hackathon judge flow — judges sharing referral links during evaluation creates a conflict-of-interest signal.
- Avoid generating tokens server-side in a Supabase trigger; do it in `ReferralService.getOrCreateToken()` so the client controls token creation timing and errors surface cleanly.