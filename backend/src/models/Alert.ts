import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AlertAttributes {
  id: number;
  alertType: 'rental_pending_approval' | 'rental_approved' | 'rental_rejected' | 'rental_expiring' | 'rental_overdue' | 'payment_pending' | 'maintenance_due' | 'insurance_expiring' | 'low_inventory' | 'system' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entityType?: string; // 'rental', 'vehicle', 'customer', etc.
  entityId?: string;
  isRead: boolean;
  isResolved: boolean;
  assignedTo?: number; // User ID
  resolvedBy?: number; // User ID
  resolvedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any> | string; // JSON con datos adicionales
  createdAt?: Date;
  updatedAt?: Date;
}

interface AlertCreationAttributes extends Optional<AlertAttributes, 'id' | 'entityType' | 'entityId' | 'isRead' | 'isResolved' | 'assignedTo' | 'resolvedBy' | 'resolvedAt' | 'expiresAt' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: number;
  public alertType!: 'rental_pending_approval' | 'rental_approved' | 'rental_rejected' | 'rental_expiring' | 'rental_overdue' | 'payment_pending' | 'maintenance_due' | 'insurance_expiring' | 'low_inventory' | 'system' | 'custom';
  public severity!: 'info' | 'warning' | 'critical';
  public title!: string;
  public message!: string;
  public entityType?: string;
  public entityId?: string;
  public isRead!: boolean;
  public isResolved!: boolean;
  public assignedTo?: number;
  public resolvedBy?: number;
  public resolvedAt?: Date;
  public expiresAt?: Date;
  public metadata?: Record<string, any> | string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Alert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    alertType: {
      type: DataTypes.ENUM(
        'rental_pending_approval',
        'rental_approved',
        'rental_rejected',
        'rental_expiring',
        'rental_overdue',
        'payment_pending',
        'maintenance_due',
        'insurance_expiring',
        'low_inventory',
        'system',
        'custom'
      ),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'critical'),
      allowNull: false,
      defaultValue: 'info',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tipo de entidad relacionada',
    },
    entityId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'ID de la entidad relacionada',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha en que expira la alerta (se oculta automáticamente)',
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON con datos adicionales',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'alerts',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['alert_type'] },
      { fields: ['severity'] },
      { fields: ['is_read'] },
      { fields: ['is_resolved'] },
      { fields: ['assigned_to'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Alert;
