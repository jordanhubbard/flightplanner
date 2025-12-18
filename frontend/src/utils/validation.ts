export interface ValidationResult {
  valid: boolean
  error?: string
  normalized?: string
}

export const normalizeAirportCode = (value: string): string => {
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return ''

  // Accept inputs like "KPAO - Palo Alto Airport" and keep only the code before the dash.
  const beforeDash = trimmed.split(/[-–—]/)[0]?.trim() || ''
  const token = beforeDash.split(/\s+/)[0]?.trim() || ''

  const match = token.match(/^[A-Z]{3,4}$/)
  return match ? token : ''
}

export const validateAirportCode = (code: string): ValidationResult => {
  const normalized = normalizeAirportCode(code)

  if (!normalized) {
    return { valid: false, error: 'Airport code is required' }
  }

  if (normalized.length !== 3 && normalized.length !== 4) {
    return {
      valid: false,
      error: 'Airport code must be 3 (IATA) or 4 (ICAO) characters',
    }
  }

  if (!/^[A-Z]+$/.test(normalized)) {
    return {
      valid: false,
      error: 'Airport code must contain only letters',
    }
  }

  return { valid: true, normalized }
}

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` }
  }
  return { valid: true }
}
