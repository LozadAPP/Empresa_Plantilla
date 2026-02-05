import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';
import { csrfProtection, securityHeaders } from './middleware/csrfProtection';

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for Swagger UI
}));

// Additional security headers (X-Frame-Options, X-XSS-Protection, etc.)
app.use(securityHeaders);

// Parse CORS origins from environment (supports comma-separated values)
const getAllowedOrigins = (): string[] => {
  const corsOrigin = env.CORS_ORIGIN;
  if (!corsOrigin) {
    return ['http://localhost:5173', 'http://localhost:3000'];
  }
  // Handle comma-separated origins
  return corsOrigin.split(',').map(o => o.trim()).filter(Boolean);
};

// Log allowed origins at startup for debugging
const allowedOrigins = getAllowedOrigins();
console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);

// Handle preflight OPTIONS requests explicitly for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// CORS configuration for HTTP-only cookie authentication
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list (handle trailing slashes)
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedOrigin = origin.replace(/\/$/, '');
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    // Log blocked origins for debugging
    console.warn(`[CORS] Blocked request from origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,  // Required for cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']  // Allow browser to read set-cookie header
}));

// Cookie parser middleware (required for HTTP-only cookie authentication)
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CSRF Protection (validates Origin header for state-changing requests)
app.use(csrfProtection);

// Trust proxy (for correct IP detection behind load balancers)
app.set('trust proxy', 1);

// Swagger API Documentation
setupSwagger(app);

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MOVICAR System API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/v1/health'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
