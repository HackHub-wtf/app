---
name: bun
description: Configures Bun runtime, package management, and JavaScript APIs for HackHub
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Bun Skill

Handles Bun runtime configuration, package management, and script execution for HackHub. The project supports both Node.js 18+ and Bun as interchangeable runtimes, with `npm` scripts as the primary interface and `bun` as a drop-in alternative.

## Quick Start

```bash
# Install dependencies
bun install          # equivalent to npm install

# Development server
bun run dev          # starts Vite on http://localhost:5173

# Production build
bun run build        # tsc -b && vite build

# Lint
bun run lint         # ESLint across all TypeScript files

# Seed scripts (Node-compatible CLI scripts)
bun run seed-data
bun run create-accounts
```

## Key Concepts

**Runtime interoperability** — HackHub's `package.json` scripts use standard Node.js tooling (Vite, tsc, ESLint). Bun executes these transparently; no Bun-specific APIs are used in application code.

**Package management** — `bun install` reads `package.json` and produces a `bun.lockb` binary lockfile. Commit `bun.lockb` when switching from `package-lock.json` to avoid mixed lockfile state.

**Script execution** — `bun run <script>` matches `npm run <script>` exactly. Bun resolves the same `node_modules/.bin` entries.

**Husky compatibility** — The `prepare` script runs `husky`. Bun executes it correctly on `bun install`; no extra configuration needed.

## Common Patterns

**Switching from npm to bun in CI**
```bash
# Replace npm ci with:
bun install --frozen-lockfile
```

**Running a one-off script without a package.json entry**
```bash
bun seed-data.js     # runs directly, no `node` prefix needed
```

**Checking Bun version**
```bash
bun --version
```

**Workspace-aware installs** — HackHub is a single-package repo (`app/`); run all `bun` commands from `HackHub-wtf/app/`.

**Environment variables** — Bun automatically loads `.env.local` in development, matching Vite's behavior. No extra `dotenv` call needed when running scripts with `bun run`.