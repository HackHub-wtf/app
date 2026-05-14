# Engagement & Feature Adoption

## When to use
Use these patterns to surface features that exist but go unnoticed — e.g., the markdown editor, voting criteria config, or file sharing. Trigger adoption nudges based on context (user is on the Ideas page but has never used the editor) rather than time.

## Patterns

### Contextual feature badge
Attach a `Tooltip` with `opened={!hasSeen('markdown-editor-hint')}` next to the editor toolbar button. Dismiss on first click with `markSeen`.

```typescript
<Tooltip
  label="Use markdown for richer idea descriptions"
  opened={!hasSeen('markdown-editor-hint') || undefined}
  withArrow
  position="top"
>
  <ActionIcon onClick={() => markSeen('markdown-editor-hint')}>
    <IconMarkdown size={16} />
  </ActionIcon>
</Tooltip>
```

### Feature spotlight (Popover)
Use Mantine `Popover` (not `Tooltip`) when the hint requires a title, body copy, and a CTA button. Cap popover copy at two sentences.

```typescript
<Popover opened={!hasSeen('voting-criteria-hint')} withArrow>
  <Popover.Target><Button>Configure Criteria</Button></Popover.Target>
  <Popover.Dropdown>
    <Text fw={600} mb={4}>Custom voting criteria</Text>
    <Text size="sm">Score ideas on dimensions that matter to your hackathon.</Text>
    <Button size="xs" mt="sm" onClick={() => markSeen('voting-criteria-hint')}>Got it</Button>
  </Popover.Dropdown>
</Popover>
```

### "New" badge on nav items
Render a Mantine `Indicator` dot on the sidebar link for a feature. Use a static hint ID versioned by feature release (e.g., `'video-call-nav-v1'`) so the badge reappears when the feature is significantly updated.

## Pitfalls
- Don't show more than one unseen hint at a time on a single screen. Maintain a priority list and render only the highest-priority unseen hint per render cycle.
- Avoid `Tooltip` for hints that need interaction — users can't click inside a `Tooltip`. Use `Popover` instead.