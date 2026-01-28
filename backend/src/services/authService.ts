import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { jwtConfig } from '../config/jwt';
import { User, Role, UserRole, Location } from '../models';
import { IUserPayload } from '../types';
import { EmailService } from './emailService';

interface LoginResult {
  success: boolean;
  message: string;
  data?: {
    user: IUserPayload;
    token: string;
    refreshToken: string;
  };
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location_id?: number;
  role_ids?: number[];
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      console.log('🔍 AuthService: Finding user with email:', email.toLowerCase());

      // Find user with roles
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }
          },
          {
            model: Location,
            as: 'location'
          }
        ]
      });

      console.log('👤 User found:', !!user);

      if (!user) {
        console.log('❌ User not found');
        return {
          success: false,
          message: 'Invalid email or password.'
        };
      }

      console.log('✓ User active:', user.is_active);
      console.log('🔑 Password hash in DB:', user.password_hash ? 'EXISTS' : 'MISSING');

      if (!user.is_active) {
        console.log('❌ Account is deactivated');
        return {
          success: false,
          message: 'Account is deactivated. Please contact administrator.'
        };
      }

      // Compare password
      console.log('🔐 Comparing passwords...');
      const isPasswordValid = await user.comparePassword(password);
      console.log('🔐 Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        return {
          success: false,
          message: 'Invalid email or password.'
        };
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Get user roles
      const roles = (user as any).roles?.map((r: Role) => r.name) || [];
      console.log('👥 User roles:', roles);

      // Create user payload
      const userPayload: IUserPayload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles,
        location_id: user.location_id
      };

      // Generate tokens
      const token = this.generateToken(userPayload);
      const refreshToken = this.generateRefreshToken(userPayload);

      console.log('✅ Login successful, generating tokens');

      return {
        success: true,
        message: 'Login successful.',
        data: {
          user: userPayload,
          token,
          refreshToken
        }
      };
    } catch (error) {
      console.error('💥 AuthService Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login.'
      };
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<LoginResult> {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered.'
        };
      }

      // Create user
      const user = await User.create({
        email: data.email.toLowerCase(),
        password_hash: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        location_id: data.location_id,
        is_active: true
      });

      // Assign roles if provided
      if (data.role_ids && data.role_ids.length > 0) {
        for (const roleId of data.role_ids) {
          await UserRole.create({
            user_id: user.id,
            role_id: roleId,
            location_id: data.location_id
          });
        }
      } else {
        // Assign default 'seller' role
        const sellerRole = await Role.findOne({ where: { name: 'seller' } });
        if (sellerRole) {
          await UserRole.create({
            user_id: user.id,
            role_id: sellerRole.id,
            location_id: data.location_id
          });
        }
      }

      // Get user with roles
      const userWithRoles = await User.findByPk(user.id, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }
          }
        ]
      });

      const roles = (userWithRoles as any).roles?.map((r: Role) => r.name) || [];

      const userPayload: IUserPayload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles,
        location_id: user.location_id
      };

      const token = this.generateToken(userPayload);
      const refreshToken = this.generateRefreshToken(userPayload);

      return {
        success: true,
        message: 'Registration successful.',
        data: {
          user: userPayload,
          token,
          refreshToken
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'An error occurred during registration.'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResult> {
    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.secret) as IUserPayload;

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
        return {
          success: false,
          message: 'User not found or inactive.'
        };
      }

      const roles = (user as any).roles?.map((r: Role) => r.name) || [];

      const userPayload: IUserPayload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles,
        location_id: user.location_id
      };

      const newToken = this.generateToken(userPayload);
      const newRefreshToken = this.generateRefreshToken(userPayload);

      return {
        success: true,
        message: 'Token refreshed successfully.',
        data: {
          user: userPayload,
          token: newToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid or expired refresh token.'
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return { success: false, message: 'User not found.' };
      }

      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return { success: false, message: 'Current password is incorrect.' };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await user.update({ password_hash: hashedPassword });

      return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'An error occurred while changing password.' };
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: IUserPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(payload: IUserPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn
    });
  }

  /**
   * Request password reset - generates token and sends email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save token to database
      await user.update({
        reset_password_token: resetToken,
        reset_password_expires: resetTokenExpires
      });

      // Send email
      const emailSent = await EmailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        `${user.first_name} ${user.last_name}`
      );

      if (!emailSent) {
        console.error('[AUTH] Failed to send password reset email');
      }

      return {
        success: true,
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'
      };
    } catch (error) {
      console.error('[AUTH] Request password reset error:', error);
      return {
        success: false,
        message: 'Ocurrió un error al procesar la solicitud.'
      };
    }
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string): Promise<{ success: boolean; message: string; userId?: number }> {
    try {
      const user = await User.findOne({
        where: { reset_password_token: token }
      });

      if (!user) {
        return {
          success: false,
          message: 'Token de recuperación inválido o expirado.'
        };
      }

      if (!user.reset_password_expires || user.reset_password_expires < new Date()) {
        return {
          success: false,
          message: 'El token de recuperación ha expirado.'
        };
      }

      return {
        success: true,
        message: 'Token válido.',
        userId: user.id
      };
    } catch (error) {
      console.error('[AUTH] Verify reset token error:', error);
      return {
        success: false,
        message: 'Error al verificar el token.'
      };
    }
  }

  /**
   * Reset password using valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({
        where: { reset_password_token: token }
      });

      if (!user) {
        return {
          success: false,
          message: 'Token de recuperación inválido o expirado.'
        };
      }

      if (!user.reset_password_expires || user.reset_password_expires < new Date()) {
        return {
          success: false,
          message: 'El token de recuperación ha expirado.'
        };
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      await user.update({
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null
      });

      // Send confirmation email
      await EmailService.sendPasswordChangedEmail(
        user.email,
        `${user.first_name} ${user.last_name}`
      );

      return {
        success: true,
        message: 'Contraseña actualizada correctamente.'
      };
    } catch (error) {
      console.error('[AUTH] Reset password error:', error);
      return {
        success: false,
        message: 'Error al restablecer la contraseña.'
      };
    }
  }
}

export default new AuthService();
