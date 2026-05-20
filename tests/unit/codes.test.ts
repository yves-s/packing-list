import { describe, it, expect } from 'vitest'
import { generateJoinCode, isValidJoinCode } from '@/lib/codes'

describe('generateJoinCode', () => {
  it('returns a 6-character string', () => {
    expect(generateJoinCode()).toMatch(/^[A-Z2-9]{6}$/)
  })
  it('avoids lookalikes 0, O, 1, I', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode()
      expect(code).not.toMatch(/[01OI]/)
    }
  })
  it('is reasonably unique across many calls', () => {
    const set = new Set(Array.from({ length: 1000 }, generateJoinCode))
    expect(set.size).toBeGreaterThan(990)
  })
})

describe('isValidJoinCode', () => {
  it('accepts canonical codes', () => {
    expect(isValidJoinCode('ABC234')).toBe(true)
  })
  it('rejects too short / too long', () => {
    expect(isValidJoinCode('ABC23')).toBe(false)
    expect(isValidJoinCode('ABCD234')).toBe(false)
  })
  it('rejects forbidden characters', () => {
    expect(isValidJoinCode('ABCO23')).toBe(false)
    expect(isValidJoinCode('abc234')).toBe(false)
  })
})
