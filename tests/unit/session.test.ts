import { describe, it, expect } from 'vitest'
import { SESSION_COOKIE, newSessionToken } from '@/lib/session'

describe('SESSION_COOKIE', () => {
  it('is a stable string', () => {
    expect(SESSION_COOKIE).toBe('camping_session')
  })
})

describe('newSessionToken', () => {
  it('produces a long random token', () => {
    const t = newSessionToken()
    expect(t).toMatch(/^[A-Za-z0-9_-]{20,}$/)
  })
  it('is unique across calls', () => {
    const set = new Set(Array.from({ length: 100 }, newSessionToken))
    expect(set.size).toBe(100)
  })
})
