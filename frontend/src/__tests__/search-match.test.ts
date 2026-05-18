import { describe, expect, it } from 'vitest'
import { matchesSearchQuery, normalizeSearchText } from '../utils/searchMatch'

describe('searchMatch', () => {
  it('normalizes spaces, hyphens, and punctuation consistently', () => {
    expect(normalizeSearchText('close-up')).toBe('closeup')
    expect(normalizeSearchText('close up')).toBe('closeup')
    expect(normalizeSearchText('close_up')).toBe('closeup')
  })

  it('matches equivalent separators in query and candidate', () => {
    expect(matchesSearchQuery('close-up', 'close up')).toBe(true)
    expect(matchesSearchQuery('close up', 'close-up')).toBe(true)
  })

  it('matches user-provided separator equivalence examples', () => {
    expect(matchesSearchQuery('close-up', 'close up')).toBe(true)
    expect(matchesSearchQuery('full-lenght_portrait', 'full lenght portrait')).toBe(true)
    expect(matchesSearchQuery('digital_drawing_(artwork)', 'digital drawing art')).toBe(true)
  })

  it('treats parentheses as non-blocking characters for matching', () => {
    expect(matchesSearchQuery('digital_drawing_(artwork)', 'artwork')).toBe(true)
    expect(matchesSearchQuery('digital_drawing_(artwork)', '(artwork)')).toBe(true)
  })

  it('supports accent-insensitive matching', () => {
    expect(matchesSearchQuery('cafe', 'café')).toBe(true)
  })

  it('returns false for empty query', () => {
    expect(matchesSearchQuery('close-up', '')).toBe(false)
    expect(matchesSearchQuery('close-up', '   ')).toBe(false)
  })
})
