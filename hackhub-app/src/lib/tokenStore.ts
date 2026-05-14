/**
 * In-memory JWT access token store.
 * Access token lives only in memory — never localStorage or sessionStorage.
 * Refresh token lives in an httpOnly cookie managed by the server.
 */

let _accessToken: string | null = null

export const tokenStore = {
  getAccessToken: (): string | null => _accessToken,
  setAccessToken: (token: string): void => { _accessToken = token },
  clear: (): void => { _accessToken = null },
  hasToken: (): boolean => _accessToken !== null,
}
