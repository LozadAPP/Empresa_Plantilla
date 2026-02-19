import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment configuration interface
 * Defines all environment variables used by the MOVICAR backend
 */
export interface EnvConfig {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_LOGGING: 'true' | 'false' | 'minimal';
  DB_SYNC: boolean;  // Solo sincronizar tablas si es true

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // CORS
  CORS_ORIGIN: string;

  // Email (optional)
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_SECURE?: boolean;
  EMAIL_USER?: string;
  EMAIL_PASSWORD?: string;
  EMAIL_FROM?: string;

  // Redis (optional)
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;

  // File Storage
  STORAGE_PATH: string;
  PDF_STORAGE_PATH: string;

  // Frontend
  FRONTEND_URL: string;

  // Business Rules
  DEFAULT_TAX_PERCENTAGE: number;
  DEFAULT_LATE_FEE_MULTIPLIER: number;
  DEFAULT_CLEANING_COST: number;
  DEFAULT_INVOICE_DUE_DAYS: number;
}

/**
 * Helper function to parse boolean from string
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Helper function to parse integer with validation
 */
function parseInteger(value: string | undefined, defaultValue: number, name: string): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`WARNING: ${name} is not a valid integer. Using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

/**
 * Helper function to parse float with validation
 */
function parseFloat(value: string | undefined, defaultValue: number, name: string): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseFloat(value);
  if (isNaN(parsed)) {
    console.warn(`WARNING: ${name} is not a valid number. Using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

/**
 * Validates and returns the environment configuration
 * Throws an error if required variables are missing
 */
function validateEnv(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // Define required variables based on environment
  const requiredVars: string[] = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  // Additional required variables for production
  if (isProduction) {
    requiredVars.push('JWT_SECRET');
  }

  // Check for missing required variables
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `CRITICAL: Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or environment configuration.`
    );
  }

  // Validate NODE_ENV value
  const validNodeEnvs = ['development', 'production', 'test'];
  if (!validNodeEnvs.includes(nodeEnv)) {
    console.warn(`WARNING: Invalid NODE_ENV "${nodeEnv}". Defaulting to "development".`);
  }

  // JWT Secret validation
  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      throw new Error('CRITICAL: JWT_SECRET environment variable is required in production!');
    }
    console.warn('WARNING: JWT_SECRET not set. Using default secret. DO NOT use in production!');
    jwtSecret = 'movicar_dev_secret_DO_NOT_USE_IN_PRODUCTION';
  } else if (jwtSecret.length < 32 && isProduction) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters for production security.');
  }

  // Build and return the configuration object
  const config: EnvConfig = {
    // Server
    NODE_ENV: (validNodeEnvs.includes(nodeEnv) ? nodeEnv : 'development') as EnvConfig['NODE_ENV'],
    PORT: parseInteger(process.env.PORT, 3001, 'PORT'),

    // Database
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: parseInteger(process.env.DB_PORT, 5432, 'DB_PORT'),
    DB_NAME: process.env.DB_NAME!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    DB_LOGGING: (process.env.DB_LOGGING as EnvConfig['DB_LOGGING']) || 'false',  // Por defecto sin logs SQL
    DB_SYNC: parseBoolean(process.env.DB_SYNC, false),   // Por defecto NO sincroniza

    // JWT
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // Email (optional)
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT ? parseInteger(process.env.EMAIL_PORT, 587, 'EMAIL_PORT') : undefined,
    EMAIL_SECURE: process.env.EMAIL_SECURE !== undefined ? parseBoolean(process.env.EMAIL_SECURE, false) : undefined,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,

    // Redis (optional)
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT ? parseInteger(process.env.REDIS_PORT, 6379, 'REDIS_PORT') : undefined,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // File Storage
    STORAGE_PATH: process.env.STORAGE_PATH || './storage',
    PDF_STORAGE_PATH: process.env.PDF_STORAGE_PATH || './storage/pdfs',

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Business Rules
    DEFAULT_TAX_PERCENTAGE: parseFloat(process.env.DEFAULT_TAX_PERCENTAGE, 16, 'DEFAULT_TAX_PERCENTAGE'),
    DEFAULT_LATE_FEE_MULTIPLIER: parseFloat(process.env.DEFAULT_LATE_FEE_MULTIPLIER, 1.5, 'DEFAULT_LATE_FEE_MULTIPLIER'),
    DEFAULT_CLEANING_COST: parseFloat(process.env.DEFAULT_CLEANING_COST, 50, 'DEFAULT_CLEANING_COST'),
    DEFAULT_INVOICE_DUE_DAYS: parseInteger(process.env.DEFAULT_INVOICE_DUE_DAYS, 7, 'DEFAULT_INVOICE_DUE_DAYS'),
  };

  return config;
}

// Validate and export the environment configuration
// This runs at module load time, failing fast if configuration is invalid
export const env = validateEnv();

// Log environment info on startup (minimal, only in non-test mode)
if (env.NODE_ENV !== 'test') {
  console.log(`Environment: ${env.NODE_ENV} | DB: ${env.DB_NAME}`);
}

export default env;
