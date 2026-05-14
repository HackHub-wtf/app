# Growth Engineering

## When to use
Apply when building mechanics that make an acquisition tool self-spreading — referral loops, share prompts, viral result pages, and invite flows.

## Patterns

**Shareable result URL**
Encode the tool output in a URL-safe slug or short ID stored in Supabase so recipients see the same result without re-running the tool.
```typescript
const { data } = await supabase
  .from('tool_results')
  .insert({ payload: result, created_by: user?.id ?? null })
  .select('id')
  .single()

const shareUrl = `${window.location.origin}/tools/team-planner/r/${data.id}`
```

**Post-submit share nudge**
Surface sharing immediately after form submission, while motivation is highest.
```typescript
{submitted && (
  <Alert icon={<IconShare size={16} />} color="teal" mt="md">
    Know someone planning a hackathon?{' '}
    <Anchor href={shareUrl} target="_blank">Share this tool</Anchor>
  </Alert>
)}
```

**Invite-to-unlock gate**
Let unauthenticated users unlock gated results by sharing the tool URL instead of signing up — lowers friction while still driving distribution.
```typescript
{!user && (
  <Stack align="center">
    <Text>Share with 2 people to unlock the full report — or <Anchor component={Link} to="/signup">sign up free</Anchor>.</Text>
    <CopyButton value={shareUrl}>
      {({ copied, copy }) => <Button onClick={copy}>{copied ? 'Copied!' : 'Copy share link'}</Button>}
    </CopyButton>
  </Stack>
)}
```

## Pitfalls
- Do not store sensitive user input (budget figures, internal team names) in publicly-accessible result rows without RLS read restrictions.
- Invite-to-unlock gates only work when the reward is visibly worth sharing for — weak tool output kills the loop before it starts.