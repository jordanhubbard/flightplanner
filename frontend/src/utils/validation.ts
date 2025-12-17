export interface ValidationResult {
  valid: boolean
  error?: string
}

export const validateAirportCode = (code: string): ValidationResult => {
  const trimmed = code.trim().toUpperCase()

  if (!trimmed) {
    return { valid: false, error: 'Airport code is required' }
  }

  if (trimmed.length !== 3 && trimmed.length !== 4) {
    return {
      valid: false,
      error: 'Airport code must be 3 (IATA) or 4 (ICAO) characters',
    }
  }

  if (!/^[A-Z]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Airport code must contain only letters',
    }
  }

  return { valid: true }
}

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` }
  }
  return { valid: true }
}
