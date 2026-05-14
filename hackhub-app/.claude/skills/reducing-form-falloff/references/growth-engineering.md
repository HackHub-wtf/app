# Growth Engineering

## When to use
Apply when designing form flows that feed a growth loop — referral capture, invite acceptance, hackathon sign-up spikes, and team formation funnels.

## Patterns

### Capture referral source at registration without adding a visible field
Pass `ref` as a hidden input from the invite URL and store it on the user profile.

```typescript
const [searchParams] = useSearchParams()

useForm({
  defaultValues: {
    referral_source: searchParams.get('ref') ?? 'direct',
  },
})

// Include in submission but hide from UI
<input type="hidden" {...register('referral_source')} />
```

### Reduce time-to-first-action by skipping optional onboarding steps
After registration, route directly to the active hackathon rather than a profile completion gate. Surface profile completion as a dismissible banner.

```typescript
onSuccess: (user) => {
  const destination = searchParams.get('next') ?? '/hackathons'
  navigate(destination)
}
```

### Show social proof near the submit button
Display a live participant count from React Query next to the CTA to reduce hesitation.

```typescript
<Text size="sm" c="dimmed">{participantCount} participants already joined</Text>
<Button type="submit" fullWidth>Join Hackathon</Button>
```

## Pitfalls
Do not force team creation before a user can explore the platform. Premature commitment steps are a leading cause of day-0 churn in event-based products.