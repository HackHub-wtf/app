# On-Page Patterns — Scaling Template Pages

## When to use
When wiring filter controls to the URL and rendering result grids using Mantine primitives.

## Patterns

### Filter bar layout with Mantine
```typescript
<Group gap="sm" align="flex-end">
  <TextInput
    placeholder="Search hackathons..."
    leftSection={<IconSearch size={16} />}
    value={query}
    onChange={e => handleQueryChange(e.currentTarget.value)}
  />
  <Select
    data={['all', 'active', 'upcoming', 'ended']}
    value={status}
    onChange={v => handleStatusChange(v ?? 'all')}
  />
</Group>
```

### Responsive result grid
```typescript
<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
  {data.map(item => <EntityCard key={item.id} item={item} />)}
</SimpleGrid>
```

### Page shell
```typescript
<Container size="lg" py="xl">
  <Stack gap="md">
    <Title order={2}>{title}</Title>
    {/* filter bar */}
    {/* state gates */}
    {/* result grid */}
  </Stack>
</Container>
```

## Pitfalls
Avoid uncontrolled `TextInput` — always bind `value` and `onChange` so the URL param and the input stay in sync.