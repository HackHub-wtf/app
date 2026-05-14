# Bun Modules

## When to use
When resolving packages, understanding lockfile behavior, or running workspace-aware installs in HackHub.

### Install a dependency
```bash
bun add @mantine/core        # production dependency
bun add -d vitest            # dev dependency
bun remove some-package
```

### Check what's installed
```bash
bun pm ls                    # list installed packages
bun pm cache rm              # clear Bun's module cache
```

### Use a local script as a module
```typescript
// Bun resolves bare specifiers from node_modules same as Node
import { supabase } from '@/lib/supabase'  // works unchanged
```

## Pitfalls
- HackHub is a single-package repo — there are no Bun workspaces configured. Do not add a top-level `package.json` `workspaces` field without also updating CI.
- `bun.lockb` is binary; it cannot be diff'd in GitHub PRs. Add a `bun install --frozen-lockfile` step to CI to catch drift.