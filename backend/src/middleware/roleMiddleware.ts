import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

type RoleName = 'admin' | 'director' | 'manager' | 'seller' | 'accountant' | 'inventory';

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const requireRole = (...allowedRoles: RoleName[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const userRoles = req.user.roles || [];

    // Admin has access to everything
    if (userRoles.includes('admin')) {
      next();
      return;
    }

    // Check if user has any of the allowed roles
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: userRoles
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has ALL required roles
 * @param requiredRoles - Array of roles that user must have
 */
export const requireAllRoles = (...requiredRoles: RoleName[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const userRoles = req.user.roles || [];

    // Admin has access to everything
    if (userRoles.includes('admin')) {
      next();
      return;
    }

    // Check if user has ALL required roles
    const hasAllPermissions = requiredRoles.every(role => userRoles.includes(role));

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Missing required permissions.',
        required: requiredRoles,
        current: userRoles
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user belongs to specific location
 * @param locationIdParam - Request parameter name containing location ID
 */
export const requireLocation = (locationIdParam: string = 'locationId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const userRoles = req.user.roles || [];

    // Admin and Director have access to all locations
    if (userRoles.includes('admin') || userRoles.includes('director')) {
      next();
      return;
    }

    const requestedLocationId = parseInt(req.params[locationIdParam] || req.body.location_id);
    const userLocationId = req.user.location_id;

    if (requestedLocationId && userLocationId && requestedLocationId !== userLocationId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access resources from your assigned location.'
      });
      return;
    }

    next();
  };
};

export default { requireRole, requireAllRoles, requireLocation };
