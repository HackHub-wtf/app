# Product Analytics

## When to use
When you need to understand which empty states users encounter most, whether CTAs are clicked, and where users drop off during onboarding. Instrument empty state renders and CTA clicks before assuming what needs improvement.

## Patterns

### Track empty state impressions
Fire a lightweight event when an empty state mounts. Use a stable `screen` identifier so you can aggregate across sessions.

```tsx
useEffect(() => {
  // Replace with your analytics client (e.g. window.gtag, posthog, or a custom util)
  analytics.track('empty_state_viewed', {
    screen: 'teams_list',
    hackathon_id: hackathonId,
    user_role: user?.role,
  })
}, []) // run once on mount
```

### Track CTA clicks on empty states
```tsx
<Button
  onClick={() => {
    analytics.track('empty_state_cta_clicked', {
      screen: 'teams_list',
      action: 'create_team',
    })
    navigate(`/hackathons/${hackathonId}/teams/new`)
  }}
>
  Create team
</Button>
```

### Track onboarding banner dismissal
```tsx
const dismiss = () => {
  analytics.track('onboarding_banner_dismissed', { user_role: user?.role })
  localStorage.setItem('onboarding_dismissed', '1')
  setDismissed(true)
}
```

## Pitfalls
- Do not fire analytics events during loading states — only track confirmed empty renders. Wrapping the `useEffect` call inside the component that is conditionally rendered (not the parent) avoids false positives.