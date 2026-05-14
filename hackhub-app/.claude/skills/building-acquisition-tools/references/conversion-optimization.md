# Conversion Optimization

## When to use
Apply when a lead capture page or tool has traffic but low signup rates — tune CTAs, form friction, and gating logic to move more visitors into Supabase auth.

## Patterns

**Progressive disclosure gating**
Show a partial result immediately, blur or truncate the rest, then surface a signup prompt. Avoids the cold-start where users see nothing before committing.
```typescript
const preview = result?.slice(0, 3)
const locked = result?.slice(3)

return (
  <>
    {preview.map(item => <ResultCard key={item.id} item={item} />)}
    {!user && locked.length > 0 && (
      <Stack align="center" mt="md">
        <div style={{ filter: 'blur(5px)', pointerEvents: 'none' }}>
          {locked.map(item => <ResultCard key={item.id} item={item} />)}
        </div>
        <Button component={Link} to="/signup">Unlock full results</Button>
      </Stack>
    )}
  </>
)
```

**Social proof near CTA**
Insert a Mantine `Badge` or `Text` with live or cached stats adjacent to the submit button to reduce hesitation.
```typescript
<Group justify="space-between" align="center">
  <Text size="xs" c="dimmed">Trusted by 1,200+ hackathon organizers</Text>
  <Button type="submit" loading={isSubmitting}>Get my report</Button>
</Group>
```

**Single-field entry point**
Ask only for email on first capture; collect name/role after signup. Fewer fields = higher completion.

## Pitfalls
- Do not gate the tool input — only gate the output. Users who can't try the tool won't submit the form.
- Avoid auto-redirecting to `/signup` on page load; it signals the tool isn't real and kills trust.