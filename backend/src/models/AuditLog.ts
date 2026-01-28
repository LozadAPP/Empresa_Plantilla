import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuditLogAttributes {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  action: 'create' | 'update' | 'delete';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp?: Date;
  ip_address?: string;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'timestamp'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public user_id!: number;
  public entity_type!: string;
  public entity_id!: number;
  public action!: 'create' | 'update' | 'delete';
  public old_values?: Record<string, any>;
  public new_values?: Record<string, any>;
  public timestamp!: Date;
  public ip_address?: string;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'audit_log',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['entity_type'] },
      { fields: ['entity_id'] },
      { fields: ['timestamp'] }
    ]
  }
);

export default AuditLog;
