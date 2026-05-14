import { describe, it, expect, beforeEach } from 'vitest'
import { tokenStore } from './tokenStore'

describe('tokenStore', () => {
  beforeEach(() => tokenStore.clear())

  it('starts empty', () => {
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.hasToken()).toBe(false)
  })

  it('stores and retrieves a token', () => {
    tokenStore.setAccessToken('tok123')
    expect(tokenStore.getAccessToken()).toBe('tok123')
    expect(tokenStore.hasToken()).toBe(true)
  })

  it('clear removes the token', () => {
    tokenStore.setAccessToken('tok123')
    tokenStore.clear()
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.hasToken()).toBe(false)
  })

  it('overwrites existing token', () => {
    tokenStore.setAccessToken('first')
    tokenStore.setAccessToken('second')
    expect(tokenStore.getAccessToken()).toBe('second')
  })
})
