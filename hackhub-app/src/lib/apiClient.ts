/**
 * Thin fetch wrapper over the Spring Boot REST API.
 * - Injects Authorization: Bearer header from the in-memory token store
 * - Handles 401 → attempts token refresh → retries once
 * - Returns typed responses or throws ApiError
 */

import { tokenStore } from './tokenStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  readonly status: number
  readonly title: string

  constructor(
    status: number,
    title: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = title
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  skipAuth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  }

  if (!skipAuth) {
    const token = tokenStore.getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    credentials: 'include', // send refresh token cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Attempt refresh on 401
  if (response.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${tokenStore.getAccessToken()}`
      const retry = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      if (retry.ok) {
        return retry.status === 204 ? (undefined as T) : retry.json()
      }
    }
    // Refresh failed — clear auth state
    tokenStore.clear()
    window.dispatchEvent(new Event('auth:session-expired'))
    throw new ApiError(401, 'Unauthorized', 'Session expired')
  }

  if (!response.ok) {
    let title = 'Error'
    let detail = response.statusText
    try {
      const problem = await response.json()
      title = problem.title ?? title
      detail = problem.detail ?? detail
    } catch {}
    throw new ApiError(response.status, title, detail)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return false
    const { accessToken } = await res.json()
    tokenStore.setAccessToken(accessToken)
    return true
  } catch {
    return false
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
