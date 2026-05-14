import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiError } from './apiClient'
import { tokenStore } from './tokenStore'

// Mock global fetch
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status })
}

describe('api client', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    tokenStore.clear()
  })

  it('GET request returns parsed JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: '1', name: 'test' }))

    const result = await api.get<{ id: string; name: string }>('/api/v1/test')
    expect(result.name).toBe('test')
  })

  it('attaches Bearer token from tokenStore', async () => {
    tokenStore.setAccessToken('my-jwt')
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.get('/api/v1/protected')

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-jwt')
  })

  it('omits Authorization header when no token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.get('/api/v1/public')

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['Authorization']).toBeUndefined()
  })

  it('POST sends JSON body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ created: true }, 201))

    await api.post('/api/v1/things', { name: 'foo' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify({ name: 'foo' }))
  })

  it('204 response returns undefined', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(204))

    const result = await api.delete('/api/v1/things/1')
    expect(result).toBeUndefined()
  })

  it('non-2xx throws ApiError', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ title: 'Not Found', detail: 'resource missing' }, 404)
    )

    await expect(api.get('/api/v1/missing')).rejects.toMatchObject({
      status: 404,
      title: 'Not Found',
    })
  })

  it('non-2xx without JSON body still throws ApiError', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))

    await expect(api.get('/api/v1/broken')).rejects.toBeInstanceOf(ApiError)
  })

  it('401 with successful refresh retries the request', async () => {
    tokenStore.setAccessToken('expired-token')

    // First call returns 401
    fetchMock.mockResolvedValueOnce(emptyResponse(401))
    // Refresh call returns new token
    fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'new-token' }))
    // Retry returns success
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    const result = await api.get<{ ok: boolean }>('/api/v1/protected')
    expect(result.ok).toBe(true)
    expect(tokenStore.getAccessToken()).toBe('new-token')
  })

  it('401 with failed refresh clears token and dispatches session-expired', async () => {
    tokenStore.setAccessToken('dead-token')
    const events: string[] = []
    window.addEventListener('auth:session-expired', () => events.push('fired'))

    fetchMock.mockResolvedValueOnce(emptyResponse(401))   // original
    fetchMock.mockResolvedValueOnce(emptyResponse(401))   // refresh fails

    await expect(api.get('/api/v1/secure')).rejects.toMatchObject({ status: 401 })
    expect(tokenStore.hasToken()).toBe(false)
    expect(events).toContain('fired')
  })

  it('401 with refresh ok but retry non-ok clears token and dispatches session-expired', async () => {
    tokenStore.setAccessToken('expired-token')
    const events: string[] = []
    window.addEventListener('auth:session-expired', () => events.push('fired'))

    fetchMock.mockResolvedValueOnce(emptyResponse(401))                       // original
    fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'new-tok' })) // refresh ok
    fetchMock.mockResolvedValueOnce(emptyResponse(403))                       // retry fails

    await expect(api.get('/api/v1/secure')).rejects.toMatchObject({ status: 401 })
    expect(tokenStore.hasToken()).toBe(false)
    expect(events).toContain('fired')
    window.removeEventListener('auth:session-expired', () => {})
  })
})
