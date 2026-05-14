# Distribution

## When to use
Apply when deciding how to route traffic to an acquisition tool — standalone URL, embedded widget, or linked from within the authenticated app.

## Patterns

**Standalone route outside Layout**
Register the tool route before the Layout wrapper in `App.tsx` so it renders without sidebar/header noise.
```typescript
// App.tsx — before the authenticated Layout routes
<Route path="/tools/team-planner" element={<TeamPlannerTool />} />
<Route path="/tools/budget-estimator" element={<BudgetEstimatorTool />} />
```

**Source tagging on lead insert**
Record where the lead came from so you can measure which distribution channels convert.
```typescript
const source = new URLSearchParams(window.location.search).get('utm_source') ?? 'direct'

await supabase.from('leads').insert({ email, name, source })
```

**In-app referral entry point**
Surface a "Share this tool" link inside the authenticated app so existing users drive organic distribution.
```typescript
<CopyButton value={`${window.location.origin}/tools/team-planner`}>
  {({ copied, copy }) => (
    <Button variant="subtle" onClick={copy}>
      {copied ? 'Link copied' : 'Share this tool'}
    </Button>
  )}
</CopyButton>
```

## Pitfalls
- Do not import `Layout` into acquisition tool pages — the sidebar and header distract from the single conversion action.
- Canonical tool URLs should be stable; changing them breaks inbound links from external referrers.