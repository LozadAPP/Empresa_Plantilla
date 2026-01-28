import { env } from './env';

/**
 * JWT Configuration
 * Uses validated environment variables from env.ts
 * JWT_SECRET validation is already handled in env.ts
 */
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
};

export default jwtConfig;
