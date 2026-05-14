# Frontend Local Development Setup

## Prerequisites

- Node.js 18+ or Bun
- Git
- Spring Boot API running (see `../api/` or `docker compose up`)

## Steps

### 1. Install dependencies

```bash
cd HackHub-wtf/app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
VITE_APP_NAME=HackHub
VITE_APP_ENVIRONMENT=development
```

`VITE_API_BASE_URL` is the Spring Boot base URL. All API calls go through `src/lib/apiClient.ts` which prepends this value.

### 3. Start the dev server

```bash
npm run dev
# http://localhost:5173
```

The frontend proxies nothing — it talks directly to `VITE_API_BASE_URL`. Make sure the Spring Boot API is running before logging in.

### 4. Run tests

```bash
npm test
```

20 tests across `src/lib/tokenStore.test.ts`, `src/lib/apiClient.test.ts`, and `src/store/authStore.test.ts`.

### 5. Build for production

```bash
npm run build    # type check + bundle
npm run preview  # serve the bundle locally
```

## Troubleshooting

**Login fails with network error** — check that `VITE_API_BASE_URL` points to a running Spring Boot instance.

**TypeScript errors on build** — run `npm run lint` first; many type errors show up there with better context.

**npm install fails** — delete `node_modules` and `package-lock.json`, then reinstall.

## Related

- Full stack startup: `docker compose up` from repo root
- API docs: `../docs/specs/`
- Architecture: `../docs/architecture/`
