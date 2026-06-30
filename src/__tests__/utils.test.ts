import { describe, it, expect } from 'vitest'
import { calculateScore, sanitizeDisplayName, generateRoomCode, formatScore } from '@/lib/utils'

describe('calculateScore', () => {
  it('returns 10 for correct answer', () => {
    expect(calculateScore(true)).toBe(10)
  })

  it('returns 0 for incorrect answer', () => {
    expect(calculateScore(false)).toBe(0)
  })
})

describe('sanitizeDisplayName', () => {
  it('trims whitespace', () => {
    expect(sanitizeDisplayName('  hello  ')).toBe('hello')
  })

  it('trims to 20 characters', () => {
    expect(sanitizeDisplayName('a'.repeat(25))).toBe('a'.repeat(20))
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeDisplayName('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeDisplayName('   ')).toBe('')
  })
})

describe('generateRoomCode', () => {
  it('returns a 6-character string', () => {
    const code = generateRoomCode()
    expect(code).toHaveLength(6)
  })

  it('contains only valid characters', () => {
    const valid = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode()
      for (const ch of code) {
        expect(valid).toContain(ch)
      }
    }
  })

  it('generates unique codes', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      codes.add(generateRoomCode())
    }
    expect(codes.size).toBe(1000)
  })
})

describe('formatScore', () => {
  it('formats a number with locale separators', () => {
    expect(formatScore(0)).toBe('0')
    expect(formatScore(10)).toBe('10')
    expect(formatScore(100)).toBe('100')
  })
})
