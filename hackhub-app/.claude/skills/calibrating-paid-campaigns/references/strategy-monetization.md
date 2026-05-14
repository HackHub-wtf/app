# Strategy & Monetization

## When to use
When mapping paid acquisition spend to plan upgrades, trial activations, or paid conversion events in Supabase.

## Patterns

**Tag signup source on the user record**
Store plan intent alongside UTMs so you can segment free vs. paid trial signups:
```typescript
await supabase.auth.signUp({
  email, password,
  options: { data: { ...utmData, intent: selectedPlan } }
})
```

**Gate paid features with a Supabase column**
Add a `plan` column to the `profiles` table; read it in `useAuthStore` and enforce in `PermissionService`:
```typescript
// src/utils/permissions.ts
export const canAccessPaidFeature = (user: AuthUser) => user.plan === 'pro'
```

**Track upgrade events back to the originating channel**
When a user upgrades, read UTMs from `raw_user_meta_data` and fire a high-value conversion event:
```typescript
const { data: profile } = await supabase.auth.getUser()
const source = profile.user.user_metadata.utm_source
trackGoogle(`AW-XXXXXXXXX/${source === 'google' ? 'UPGRADE_GOOGLE' : 'UPGRADE_OTHER'}`)
```

## Pitfalls
Do not rely solely on client-side conversion events for revenue reporting — verify upgrade counts against Supabase `profiles` rows to catch cases where the pixel fired but the payment failed.