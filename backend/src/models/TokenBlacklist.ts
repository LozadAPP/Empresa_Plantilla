import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database';
import logger from '../config/logger';

/**
 * TokenBlacklist Model
 * Stores invalidated JWT tokens to prevent reuse after logout
 * Tokens are stored with their expiration time for automatic cleanup
 */

interface TokenBlacklistAttributes {
  id: number;
  token_hash: string;        // SHA-256 hash of the token (not the token itself)
  user_id: number;           // User who owned the token
  token_type: 'access' | 'refresh';
  expires_at: Date;          // When the token would have expired naturally
  revoked_at: Date;          // When the token was revoked
  reason?: string;           // Optional reason for revocation (logout, password_change, etc.)
}

interface TokenBlacklistCreationAttributes extends Optional<TokenBlacklistAttributes, 'id' | 'revoked_at' | 'reason'> {}

class TokenBlacklist extends Model<TokenBlacklistAttributes, TokenBlacklistCreationAttributes> implements TokenBlacklistAttributes {
  public id!: number;
  public token_hash!: string;
  public user_id!: number;
  public token_type!: 'access' | 'refresh';
  public expires_at!: Date;
  public revoked_at!: Date;
  public reason?: string;

  /**
   * Check if a token hash is blacklisted
   */
  static async isBlacklisted(tokenHash: string): Promise<boolean> {
    const entry = await TokenBlacklist.findOne({
      where: {
        token_hash: tokenHash,
        expires_at: { [Op.gt]: new Date() } // Only check unexpired entries
      }
    });
    return !!entry;
  }

  /**
   * Add a token to the blacklist
   */
  static async addToBlacklist(
    tokenHash: string,
    userId: number,
    tokenType: 'access' | 'refresh',
    expiresAt: Date,
    reason?: string
  ): Promise<TokenBlacklist> {
    return TokenBlacklist.create({
      token_hash: tokenHash,
      user_id: userId,
      token_type: tokenType,
      expires_at: expiresAt,
      reason
    });
  }

  /**
   * Revoke all tokens for a user (useful for password change, security breach)
   */
  static async revokeAllUserTokens(userId: number, reason: string = 'manual_revocation'): Promise<void> {
    // This is a placeholder - in a real implementation, you'd need to track all issued tokens
    // For now, this marks the user's tokens as requiring re-authentication
    logger.info(`All tokens for user ${userId} should be revoked. Reason: ${reason}`);
  }

  /**
   * Clean up expired blacklist entries (should be run periodically)
   */
  static async cleanupExpired(): Promise<number> {
    const result = await TokenBlacklist.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() }
      }
    });
    return result;
  }
}

TokenBlacklist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    token_hash: {
      type: DataTypes.STRING(64), // SHA-256 produces 64 hex characters
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    token_type: {
      type: DataTypes.ENUM('access', 'refresh'),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reason: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'TokenBlacklist',
    tableName: 'token_blacklist',
    timestamps: false, // We use revoked_at instead of createdAt/updatedAt
    indexes: [
      {
        fields: ['token_hash'],
        unique: true
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['expires_at'] // For efficient cleanup queries
      }
    ]
  }
);

export default TokenBlacklist;
