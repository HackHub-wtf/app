---
name: vite
description: Configures Vite build tool, development server, and bundling for HackHub React/TypeScript application
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Vite Skill

Handles Vite 7.x configuration for HackHub: development server setup, production builds, environment variables, and plugin management for a React 19 + TypeScript + Mantine application deployed to Cloudflare Pages.

## Quick Start

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # tsc -b && vite build (type check + bundle)
npm run preview    # Preview production bundle locally
```

## Key Concepts

**Config file**: `vite.config.ts` at project root (`/Users/kinncj/Development/HackHub-wtf/app/vite.config.ts`)

**Plugin**: `@vitejs/plugin-react` — required for React 19 Fast Refresh and JSX transform

**Environment variables**: Vite exposes only `VITE_*` prefixed vars to the client. The app uses:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME`
- `VITE_APP_ENVIRONMENT`

Non-prefixed vars (`SUPABASE_LOCAL_URL`, `SUPABASE_LOCAL_ANON_KEY`) are server-only and not bundled.

**Path aliases**: Use `@/` to map to `src/` — configure in both `vite.config.ts` and `tsconfig.json` to keep TypeScript and Vite in sync.

**Build output**: Static bundle consumed by Cloudflare Pages. `tsc -b` runs before `vite build` to catch type errors before bundling.

## Common Patterns

**Standard config for this project**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
```

**Adding path alias** — update both files:
```typescript
// vite.config.ts
resolve: { alias: { '@': resolve(__dirname, './src') } }

// tsconfig.json compilerOptions
"paths": { "@/*": ["./src/*"] }
```

**Proxying local Supabase in dev** (avoids CORS when using local instance)
```typescript
server: {
  proxy: {
    '/supabase': {
      target: 'http://localhost:54321',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/supabase/, ''),
    },
  },
},
```

**Optimizing deps** — if a package causes dev server slowness, pre-bundle it:
```typescript
optimizeDeps: {
  include: ['@mantine/core', '@mantine/hooks', '@tanstack/react-query'],
}
```

**Build size analysis**
```bash
npx vite-bundle-visualizer  # or add rollup-plugin-visualizer to config
```

**Diagnosing build failures**
1. Run `tsc -b` alone first — type errors surface before Vite runs
2. Check `VITE_*` env vars are present in `.env.local`
3. Verify `@/` alias resolves in both `vite.config.ts` and `tsconfig.json`
4. For Cloudflare Pages: confirm `public/` contains only static assets, no server code