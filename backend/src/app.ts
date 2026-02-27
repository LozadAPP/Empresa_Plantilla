import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';
import { csrfProtection, securityHeaders } from './middleware/csrfProtection';
import { getAllowedOrigins, getCorsOptions } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter';

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for Swagger UI
}));

// Additional security headers (X-Frame-Options, X-XSS-Protection, etc.)
app.use(securityHeaders);

// Handle preflight OPTIONS requests explicitly for all routes
app.options('*', cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// CORS configuration for HTTP-only cookie authentication
// Uses centralized configuration from config/cors.ts
app.use(cors(getCorsOptions()));

// Cookie parser middleware (required for HTTP-only cookie authentication)
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CSRF Protection (validates Origin header for state-changing requests)
// Uses the same origin validation as CORS from config/cors.ts
app.use(csrfProtection);

// Trust proxy (for correct IP detection behind load balancers)
app.set('trust proxy', 1);

// Swagger API Documentation
setupSwagger(app);

// Global rate limiting
app.use('/api/v1', generalLimiter);

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
