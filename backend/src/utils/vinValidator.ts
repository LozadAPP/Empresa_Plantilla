/**
 * VIN (Vehicle Identification Number) Validator
 * Implements ISO 3779 standard with checksum verification
 *
 * A valid VIN:
 * - Has exactly 17 characters
 * - Contains only alphanumeric characters (excluding I, O, Q)
 * - Has a valid check digit at position 9
 */

// Character to numeric value mapping for VIN checksum calculation
const TRANSLITERATION: Record<string, number> = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
  'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

// Position weights for checksum calculation (positions 1-17)
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export interface VinValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a VIN number according to ISO 3779 standard
 * @param vin - The VIN string to validate
 * @returns Object with valid flag and optional error message
 */
export function validateVIN(vin: string): VinValidationResult {
  // Check if VIN is provided
  if (!vin) {
    return { valid: false, error: 'VIN es requerido' };
  }

  // Normalize to uppercase and trim
  const cleanVin = vin.toUpperCase().trim();

  // Check length (must be exactly 17 characters)
  if (cleanVin.length !== 17) {
    return { valid: false, error: 'VIN debe tener exactamente 17 caracteres' };
  }

  // Check for invalid characters (I, O, Q are not allowed in VINs)
  if (/[IOQ]/.test(cleanVin)) {
    return { valid: false, error: 'VIN no puede contener las letras I, O o Q' };
  }

  // Check that all characters are valid alphanumeric (excluding I, O, Q)
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
    return { valid: false, error: 'VIN solo puede contener letras (excepto I, O, Q) y números' };
  }

  // Calculate checksum using ISO 3779 algorithm
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = cleanVin[i];
    const value = TRANSLITERATION[char];

    if (value === undefined) {
      return { valid: false, error: `Carácter inválido en VIN: ${char}` };
    }

    sum += value * WEIGHTS[i];
  }

  // Calculate check digit (position 9)
  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 'X' : remainder.toString();

  // Verify check digit matches position 9
  if (cleanVin[8] !== checkDigit) {
    return {
      valid: false,
      error: 'VIN inválido: dígito verificador incorrecto'
    };
  }

  return { valid: true };
}

/**
 * Express-validator custom validator for VIN
 * @param value - The VIN value to validate
 * @returns true if valid, throws error message if invalid
 */
export function isValidVIN(value: string): boolean {
  const result = validateVIN(value);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return true;
}

export default { validateVIN, isValidVIN };
