import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import authService from '../services/authService';
import { AuthRequest } from '../types';
import { env } from '../config/env';
import { TokenBlacklist } from '../models';
import { hashToken, getTokenExpiration, getUserIdFromToken } from '../utils/tokenUtils';

/**
 * Cookie configuration for secure JWT storage
 * HTTP-only cookies prevent XSS attacks from accessing tokens
 */
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,  // Prevents JavaScript access (XSS protection)
  secure: env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge,
  path: '/'
});

// Parse duration string to milliseconds
const parseDuration = (duration: string): number => {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return 24 * 60 * 60 * 1000; // Default 24h

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
};

const ACCESS_TOKEN_MAX_AGE = parseDuration(env.JWT_EXPIRES_IN);
const REFRESH_TOKEN_MAX_AGE = parseDuration(env.JWT_REFRESH_EXPIRES_IN);

class AuthController {
  constructor() {
    // Bind all methods to preserve 'this' context when used as Express handlers
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.me = this.me.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.verifyResetToken = this.verifyResetToken.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  /**
   * Sets authentication cookies on the response
   */
  private setAuthCookies(res: Response, token: string, refreshToken: string): void {
    res.cookie('accessToken', token, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
    res.cookie('refreshToken', refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));
  }

  /**
   * Clears authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  /**
   * POST /auth/login
   * Login user with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 Login attempt:', { email: req.body.email });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const { email, password } = req.body;
      console.log('📧 Email:', email);
      console.log('🔑 Password received:', password ? '***' : 'NO PASSWORD');

      const result = await authService.login(email, password);

      console.log('📊 Login result:', {
        success: result.success,
        message: result.message,
        hasData: !!result.data
      });

      if (!result.success) {
        console.log('❌ Login failed:', result.message);
        res.status(401).json(result);
        return;
      }

      // Set HTTP-only cookies with tokens
      const { token, refreshToken, user } = result.data!;
      this.setAuthCookies(res, token, refreshToken);

      console.log('✅ Login successful for:', email);
      // Return only user data, tokens are in HTTP-only cookies
      res.status(200).json({
        success: true,
        message: result.message,
        data: { user }
      });
    } catch (error) {
      console.error('💥 Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /auth/register
   * Register new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const { email, password, first_name, last_name, phone, location_id, role_ids } = req.body;

      const result = await authService.register({
        email,
        password,
        first_name,
        last_name,
        phone,
        location_id,
        role_ids
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /auth/refresh
   * Refresh access token using HTTP-only cookie
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from HTTP-only cookie
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        // Clear invalid cookies
        this.clearAuthCookies(res);
        res.status(401).json(result);
        return;
      }

      // Set new tokens in HTTP-only cookies
      const { token, refreshToken: newRefreshToken } = result.data!;
      this.setAuthCookies(res, token, newRefreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      console.error('Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /auth/logout
   * Logout user by clearing HTTP-only cookies and blacklisting tokens
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tokens from cookies to blacklist them
      const accessToken = req.cookies?.accessToken;
      const refreshToken = req.cookies?.refreshToken;

      // Blacklist access token if present
      if (accessToken) {
        const accessTokenHash = hashToken(accessToken);
        const accessExpiration = getTokenExpiration(accessToken);
        const userId = getUserIdFromToken(accessToken);

        if (accessExpiration && userId) {
          await TokenBlacklist.addToBlacklist(
            accessTokenHash,
            userId,
            'access',
            accessExpiration,
            'logout'
          );
        }
      }

      // Blacklist refresh token if present
      if (refreshToken) {
        const refreshTokenHash = hashToken(refreshToken);
        const refreshExpiration = getTokenExpiration(refreshToken);
        const userId = getUserIdFromToken(refreshToken);

        if (refreshExpiration && userId) {
          await TokenBlacklist.addToBlacklist(
            refreshTokenHash,
            userId,
            'refresh',
            refreshExpiration,
            'logout'
          );
        }
      }

      // Clear HTTP-only authentication cookies
      this.clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear cookies even if blacklisting fails
      this.clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    }
  }

  /**
   * GET /auth/me
   * Get current user info
   */
  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error) {
      console.error('Me controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /auth/change-password
   * Change user password
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Change password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /auth/forgot-password
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);

      res.status(200).json(result);
    } catch (error) {
      console.error('Forgot password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /auth/verify-reset-token
   * Verify if reset token is valid
   */
  async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required'
        });
        return;
      }

      const result = await authService.verifyResetToken(token);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Verify reset token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /auth/reset-password
   * Reset password using token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Reset password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new AuthController();
