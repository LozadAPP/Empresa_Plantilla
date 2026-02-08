/**
 * Centralized CORS Configuration
 *
 * This module provides a single source of truth for CORS and origin validation.
 * Used by both the CORS middleware and CSRF protection middleware.
 */
import { env } from './env';

/**
 * Parse allowed origins from environment variable.
 * Supports comma-separated values for multiple origins.
 *
 * @example
 * CORS_ORIGIN=https://example.com,https://staging.example.com
 */
export const getAllowedOrigins = (): string[] => {
  const corsOrigin = env.CORS_ORIGIN;

  if (!corsOrigin) {
    return ['http://localhost:5173', 'http://localhost:3000'];
  }

  // Handle comma-separated origins
  return corsOrigin.split(',').map(o => o.trim()).filter(Boolean);
};

/**
 * Normalize a URL by removing trailing slashes for consistent comparison.
 */
const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Check if an origin is in the allowed list.
 * Handles trailing slash differences automatically.
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();
  const normalizedOrigin = normalizeUrl(origin);

  return allowedOrigins.some(allowed => normalizeUrl(allowed) === normalizedOrigin);
};

/**
 * Extract origin from a Referer header.
 * Used as fallback when Origin header is not present.
 */
export const getOriginFromReferer = (referer: string | undefined): string | undefined => {
  if (!referer) return undefined;

  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
};

/**
 * CORS options factory for use with the cors middleware.
 * This ensures consistent configuration across the application.
 */
export const getCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      // Log blocked origins for debugging
      console.warn(`[CORS] Blocked request from origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
  };
};

// Log allowed origins at module load (once at startup)
const origins = getAllowedOrigins();
console.log(`[CORS] Configured origins: ${origins.join(', ')}`);

export default {
  getAllowedOrigins,
  isOriginAllowed,
  getOriginFromReferer,
  getCorsOptions
};
