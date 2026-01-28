import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * CSRF Protection Middleware for REST APIs
 *
 * For JWT-based authentication (tokens in localStorage), traditional cookie-based
 * CSRF protection doesn't apply directly. Instead, we use Origin/Referer validation
 * which is effective for preventing cross-origin attacks.
 *
 * This middleware:
 * 1. Validates Origin header against allowed origins
 * 2. Falls back to Referer header validation
 * 3. Blocks requests from unknown origins on state-changing methods
 */

// Parse allowed origins from environment
const getAllowedOrigins = (): string[] => {
  const corsOrigin = env.CORS_ORIGIN;

  if (Array.isArray(corsOrigin)) {
    return corsOrigin;
  }

  if (typeof corsOrigin === 'string') {
    // Handle comma-separated origins or single origin
    return corsOrigin.split(',').map(o => o.trim());
  }

  return ['http://localhost:5173', 'http://localhost:3000'];
};

// Methods that require CSRF protection (state-changing)
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Paths exempt from CSRF protection (public endpoints)
const EXEMPT_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/health',
  '/api-docs',
  '/'
];

/**
 * Validates if the request origin is allowed
 */
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some(allowed => {
    // Exact match
    if (origin === allowed) return true;
    // Handle trailing slashes
    if (origin === allowed.replace(/\/$/, '') || origin + '/' === allowed) return true;
    return false;
  });
};

/**
 * Extracts origin from Referer header
 */
const getOriginFromReferer = (referer: string | undefined): string | undefined => {
  if (!referer) return undefined;

  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
};

/**
 * Checks if path is exempt from CSRF protection
 */
const isPathExempt = (path: string): boolean => {
  return EXEMPT_PATHS.some(exempt => path.startsWith(exempt));
};

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip for non-protected methods (GET, HEAD, OPTIONS)
  if (!PROTECTED_METHODS.includes(req.method)) {
    return next();
  }

  // Skip for exempt paths
  if (isPathExempt(req.path)) {
    return next();
  }

  // Get origin from Origin header or Referer
  const origin = req.get('Origin') || getOriginFromReferer(req.get('Referer'));

  // In development, allow requests without origin (Postman, curl, etc.)
  if (env.NODE_ENV === 'development' && !origin) {
    return next();
  }

  // Validate origin
  if (!isOriginAllowed(origin)) {
    console.warn(`[CSRF] Blocked request from unauthorized origin: ${origin || 'none'}`);
    res.status(403).json({
      success: false,
      message: 'Request blocked: Invalid origin'
    });
    return;
  }

  next();
};

/**
 * Add security headers for additional CSRF protection
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Prevent embedding in iframes (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

export default csrfProtection;
