import { describe, expect, it } from 'vitest'

import { normalizeAirportCode, validateAirportCode } from './validation'

describe('normalizeAirportCode', () => {
  it('extracts airport code before dash', () => {
    expect(normalizeAirportCode('KPAO - Palo Alto Airport')).toBe('KPAO')
  })

  it('extracts airport code before em dash', () => {
    expect(normalizeAirportCode('ksfo — San Francisco')).toBe('KSFO')
  })
})

describe('validateAirportCode', () => {
  it('validates airport code with description', () => {
    const res = validateAirportCode('KPAO - Palo Alto Airport')
    expect(res.valid).toBe(true)
    expect(res.normalized).toBe('KPAO')
  })
})
