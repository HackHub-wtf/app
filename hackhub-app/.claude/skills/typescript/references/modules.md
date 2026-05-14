# Module & Import Conventions

## When to use
When adding imports to any file in HackHub — components, hooks, stores, services, or utilities.

## Patterns

**Canonical import order**
```typescript
// 1. React and external libraries
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Mantine
import { Card, Button, Group } from '@mantine/core'

// 3. Absolute project imports
import { useAuthStore } from '@/store/authStore'
import { TeamService } from '@/services/teamService'

// 4. Relative imports
import { formatDate } from '../utils/formatDate'

// 5. Type-only imports
import type { Team } from '@/types/team.types'

// 6. Styles and assets
import styles from './TeamList.module.css'
```

**Type-only import for domain types**
```typescript
import type { Database } from '@/lib/supabase'
import type { UserRole } from '@/utils/permissions'
```

**Service as static class (no instantiation)**
```typescript
// services export static methods — import the class, call static methods
import { TeamService } from '@/services/teamService'
const teams = await TeamService.getTeams(hackathonId)
```

## Pitfalls
- Mixing `import type` and value imports in one line causes `verbatimModuleSyntax` errors. Split them.
- Avoid barrel `index.ts` re-exports across service/store layers — they create circular dependency risk in this architecture.