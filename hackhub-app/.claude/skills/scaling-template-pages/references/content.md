# Content Patterns — Scaling Template Pages

## When to use
When writing empty states, error messages, and placeholder copy for listing pages.

## Patterns

### Empty state copy
```typescript
<Stack align="center" py="xl">
  <IconSearch size={48} color="gray" />
  <Text c="dimmed" ta="center">
    No {entityName} match your search. Try adjusting your filters.
  </Text>
</Stack>
```

### Error message
```typescript
<Alert color="red" title="Could not load results">
  {(error as Error).message}
</Alert>
```

### Search placeholder convention
Follow `Search <entity plural>...` — e.g. `Search hackathons...`, `Search teams...`. Consistent phrasing reduces cognitive load across pages.

## Pitfalls
Don't use generic "Something went wrong" — surface the actual error message so users and developers can act on it.