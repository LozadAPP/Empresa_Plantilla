import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Token Utilities for secure token handling
 */

/**
 * Creates a SHA-256 hash of a token
 * We store hashes instead of actual tokens for security
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Extracts the expiration date from a JWT token
 * @param token - The JWT token
 * @returns Date when the token expires, or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts the user ID from a JWT token
 * @param token - The JWT token
 * @returns User ID or null if invalid
 */
export function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as { id?: number } | null;
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}

export default { hashToken, getTokenExpiration, getUserIdFromToken };
