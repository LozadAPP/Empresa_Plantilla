import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { isOriginAllowed, getOriginFromReferer } from '../config/cors';

/**
 * CSRF Protection Middleware for REST APIs
 *
 * For JWT-based authentication (tokens in localStorage), traditional cookie-based
 * CSRF protection doesn't apply directly. Instead, we use Origin/Referer validation
 * which is effective for preventing cross-origin attacks.
 *
 * This middleware:
 * 1. Validates Origin header against allowed origins (uses centralized config/cors.ts)
 * 2. Falls back to Referer header validation
 * 3. Blocks requests from unknown origins on state-changing methods
 */

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
