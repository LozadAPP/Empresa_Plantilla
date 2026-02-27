import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Global API rate limiter
 * Production: 100 requests per minute
 * Development: 500 requests per minute
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 500 : 100,
  message: { success: false, message: 'Demasiadas solicitudes. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});
