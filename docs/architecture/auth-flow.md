# Auth Flow

HackHub uses stateless JWT authentication with RS256-signed access tokens and httpOnly cookie-based refresh tokens. The access token lives only in memory (never `localStorage`); the refresh token is managed entirely by the server via an httpOnly `Set-Cookie` header.

## Token Storage

| Token | Where stored | TTL |
|---|---|---|
| Access token | In-memory (`tokenStore`) | 900 s (15 min) |
| Refresh token | httpOnly cookie (server-managed) | 604 800 s (7 days) |

## Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant authStore
    participant apiClient
    participant API as Spring API

    User->>Browser: enter email + password
    Browser->>authStore: login(email, password)
    authStore->>apiClient: POST /api/v1/auth/login (skipAuth=true)
    apiClient->>API: POST /api/v1/auth/login { email, password }
    API-->>apiClient: 200 { accessToken } + Set-Cookie: refresh_token (httpOnly)
    apiClient-->>authStore: { accessToken }
    authStore->>authStore: tokenStore.setAccessToken(accessToken)
    authStore->>apiClient: GET /api/v1/profiles/me
    apiClient->>API: GET /api/v1/profiles/me (Bearer token)
    API-->>apiClient: 200 { id, email, name, role, skills }
    apiClient-->>authStore: ProfileResponse
    authStore->>authStore: set({ user })
    authStore-->>Browser: user populated
    Browser-->>User: redirect to dashboard
```

## Token Refresh Flow

When any request returns HTTP 401, `apiClient` automatically attempts a silent refresh before failing.

```mermaid
sequenceDiagram
    participant Comp as React Component
    participant TQ as TanStack Query
    participant AC as apiClient
    participant TS as tokenStore
    participant API as Spring API

    Comp->>TQ: useQuery / useMutation
    TQ->>AC: GET /api/v1/... (expired token)
    AC->>API: GET /api/v1/... Authorization: Bearer <expired>
    API-->>AC: 401 Unauthorized
    AC->>API: POST /api/v1/auth/refresh (credentials: include → sends httpOnly cookie)
    alt refresh succeeds
        API-->>AC: 200 { accessToken }
        AC->>TS: setAccessToken(newToken)
        AC->>API: GET /api/v1/... Authorization: Bearer <new>
        API-->>AC: 200 original response
        AC-->>TQ: resolved data
        TQ-->>Comp: updated data
    else refresh fails
        API-->>AC: 401
        AC->>TS: clear()
        AC->>AC: dispatchEvent('auth:session-expired')
        AC-->>TQ: throws ApiError(401)
        TQ-->>Comp: error state
    end
```

## Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant authStore
    participant apiClient
    participant API as Spring API

    User->>Browser: fill register form (name, email, password)
    Browser->>authStore: signup(email, password, name)
    authStore->>apiClient: POST /api/v1/auth/register (skipAuth=true)
    apiClient->>API: POST /api/v1/auth/register { email, name, password }
    API-->>apiClient: 201 { accessToken, user } + Set-Cookie: refresh_token (httpOnly)
    apiClient-->>authStore: AuthResponse
    authStore->>authStore: tokenStore.setAccessToken(accessToken)
    authStore->>authStore: set({ user: mapUser(data.user) })
    authStore-->>Browser: user populated
    Browser-->>User: redirect to organisation setup
```

## Session Restore on Page Reload

On application mount, `authStore.initialize()` silently tries to restore the session from the httpOnly cookie without prompting the user.

```mermaid
sequenceDiagram
    participant App as App.tsx
    participant authStore
    participant API as Spring API

    App->>authStore: initialize()
    authStore->>authStore: tokenStore.hasToken() → false (fresh load)
    authStore->>API: POST /api/v1/auth/refresh (credentials: include)
    alt cookie valid
        API-->>authStore: 200 { accessToken }
        authStore->>authStore: tokenStore.setAccessToken(accessToken)
        authStore->>API: GET /api/v1/profiles/me
        API-->>authStore: 200 ProfileResponse
        authStore->>authStore: set({ user, initialized: true })
    else cookie missing or expired
        API-->>authStore: 401
        authStore->>authStore: set({ user: null, initialized: true })
    end
```

## Logout Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant authStore
    participant API as Spring API

    User->>Browser: click "Sign out"
    Browser->>authStore: logout()
    authStore->>API: POST /api/v1/auth/logout (Bearer token)
    API-->>authStore: 204 + clears refresh_token cookie
    authStore->>authStore: tokenStore.clear()
    authStore->>authStore: set({ user: null })
    authStore-->>Browser: unauthenticated state
    Browser-->>User: redirect to /login
```
