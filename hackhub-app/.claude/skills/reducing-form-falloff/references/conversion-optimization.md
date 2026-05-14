# Conversion Optimization

## When to use
Apply when auditing a form that has high abandonment, too many fields, or poor error recovery. Targets: Login, registration, team join, idea submission, and hackathon creation flows.

## Patterns

### Reduce field count at the gate
Only ask what is required to create the record. Defer optional fields (bio, avatar, social links) to a profile edit page post-signup.

```typescript
// Registration: name + email + password only
const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})
```

### Validate on blur, not on submit
Users correct mistakes as they go rather than seeing a wall of errors at the end.

```typescript
useForm<FormValues>({
  resolver: zodResolver(schema),
  mode: 'onBlur',
})
```

### Lock the submit button only while pending
Re-enable immediately on error so the user can retry without a page reload.

```typescript
<Button type="submit" loading={mutation.isPending} disabled={mutation.isPending}>
  Create Team
</Button>
```

## Pitfalls
Do not disable the submit button before the user has touched any field — it signals the form is broken before they have done anything wrong.