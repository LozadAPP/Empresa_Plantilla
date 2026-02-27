import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { AuthRequest, IUserPayload } from '../types';
import { User, Role, TokenBlacklist } from '../models';
import { hashToken } from '../utils/tokenUtils';
import logger from '../config/logger';

/**
 * Extracts JWT token from HTTP-only cookie or Authorization header (fallback)
 * Priority: 1. HTTP-only cookie (secure), 2. Authorization header (legacy support)
 */
const extractToken = (req: AuthRequest): string | null => {
  // Primary: HTTP-only cookie (secure method)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Fallback: Authorization header (for API clients, Postman, etc.)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    try {
      // Check if token is blacklisted (revoked)
      const tokenHash = hashToken(token);
      const isBlacklisted = await TokenBlacklist.isBlacklisted(tokenHash);

      if (isBlacklisted) {
        res.status(401).json({
          success: false,
          message: 'Token has been revoked. Please login again.'
        });
        return;
      }

      const decoded = jwt.verify(token, jwtConfig.secret) as IUserPayload;

      // Verify user still exists and is active
      const user = await User.findByPk(decoded.id, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }
          }
        ]
      });

      if (!user || !user.is_active) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive.'
        });
        return;
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: (user as any).roles?.map((r: Role) => r.name) || [],
        location_id: user.location_id
      };

      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
      return;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as IUserPayload;
    req.user = decoded;
  } catch {
    // Token invalid, continue without user
  }

  next();
};

export default authMiddleware;
