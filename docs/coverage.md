# Test Coverage

[![Coverage](https://codecov.io/gh/HackHub-wtf/app/branch/main/graph/badge.svg?token=UAGNTK863X)](https://codecov.io/gh/HackHub-wtf/app)

Coverage is tracked via Codecov. Two flags break it down by layer:

| Flag | Source | Gate |
|------|--------|------|
| `api` | JaCoCo (Java) | ≥ 80% line coverage |
| `frontend` | Vitest v8 (TypeScript) | — |

Reports are uploaded on every push to `main` and on pull requests.

---

## Coverage Maps

### Sunburst

Hierarchical view — outer rings are files, inner rings are directories. Dark segments are uncovered.

<p align="center">
  <a href="https://codecov.io/gh/HackHub-wtf/app">
    <img src="https://codecov.io/gh/HackHub-wtf/app/graphs/sunburst.svg?token=UAGNTK863X" alt="Coverage sunburst" width="480" />
  </a>
</p>

### Grid (Treemap)

Area is proportional to lines of code. Colour shows coverage — green is covered, red is not.

<p align="center">
  <a href="https://codecov.io/gh/HackHub-wtf/app">
    <img src="https://codecov.io/gh/HackHub-wtf/app/graphs/tree.svg?token=UAGNTK863X" alt="Coverage treemap" width="600" />
  </a>
</p>

### Icicle

Top-down tree — root at the top, leaves at the bottom. Width is proportional to lines of code.

<p align="center">
  <a href="https://codecov.io/gh/HackHub-wtf/app">
    <img src="https://codecov.io/gh/HackHub-wtf/app/graphs/icicle.svg?token=UAGNTK863X" alt="Coverage icicle" width="600" />
  </a>
</p>

---

## What is excluded

Files that are untestable by design are excluded from both JaCoCo and the Codecov badge:

| Excluded | Reason |
|----------|--------|
| `HackHubApplication.java` | Spring Boot `main()` |
| `infrastructure/config/**` | Spring Security DSL, bean wiring |
| `infrastructure/storage/**` | MinIO client wrappers |
| `infrastructure/security/JwtProvider*` | Loaded from disk keys at runtime |
| `infrastructure/websocket/WebSocketConfig` | STOMP registry config |
| `presentation/websocket/**` | STOMP handlers |
| `hackhub-app/src/main.tsx` | Vite entrypoint |
| `hackhub-app/src/App.tsx` | Router root |
| `hackhub-app/src/pages/**` | Route-level shells |
| `hackhub-app/src/components/**` | Visual components |
| `hackhub-app/src/contexts/**` | React context providers |
| `hackhub-app/src/hooks/useRealtime.ts` | STOMP lifecycle hook |
| `hackhub-app/src/hooks/useSocket.ts` | WebSocket hook |
