# Measurement & Testing

## When to use
Apply when instrumenting forms to measure drop-off, field-level abandonment, or error frequency before and after an optimization.

## Patterns

### Track field-level abandonment with blur events
```typescript
const trackFieldBlur = (fieldName: string, hasError: boolean) => {
  analytics.track('form_field_blur', { field: fieldName, has_error: hasError })
}

<TextInput
  onBlur={(e) => {
    field.onBlur()
    trackFieldBlur('email', !!errors.email)
  }}
/>
```

### Track form submission outcomes
```typescript
mutation.mutate(data, {
  onSuccess: () => analytics.track('form_submitted', { form: 'registration', success: true }),
  onError: (err) => analytics.track('form_submitted', { form: 'registration', success: false, error: err.message }),
})
```

### A/B test step count with a feature flag
Keep both a single-page and a multi-step variant behind a flag. Compare completion rates before removing the losing variant.

```typescript
const isMultiStep = featureFlags.get('registration_multi_step')
return isMultiStep ? <MultiStepRegistration /> : <SinglePageRegistration />
```

## Pitfalls
Do not track PII (email addresses, names) in analytics events — only track field names and error codes. Supabase user IDs are safe as anonymous identifiers.