# Distribution

## When to use
When deciding how to surface onboarding prompts, activation nudges, or feature announcements to users who are already inside the app.

## Patterns

**Route-level onboarding injection**
In `App.tsx`, wrap protected routes with an `OnboardingGate` component that checks `profile.onboarding_completed` from TanStack Query. If incomplete, render an onboarding overlay or redirect to `/onboarding` before showing the destination page.

**Notification-driven re-engagement**
Use `notificationService.ts` to send an in-app notification when a user has been idle for more than 24 hours without completing their first activation milestone. Link the notification directly to the next incomplete step.

**Post-action confirmation as a nudge**
After a user completes a step (e.g., joins a hackathon), immediately surface the next step in a `Notification` or `Alert` banner rather than waiting for them to navigate back to an onboarding checklist.

## Pitfalls
- Don't distribute onboarding prompts through channels the user hasn't opted into (email, push) without confirming preferences first. In-app is the safe default; external channels require explicit consent.