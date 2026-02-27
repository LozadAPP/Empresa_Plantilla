import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SystemConfigAttributes {
  id: number;
  configKey: string;
  configValue: string;
  configType: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'pricing' | 'email' | 'notifications' | 'security' | 'business' | 'fiscal';
  description?: string;
  isEditable: boolean;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SystemConfigCreationAttributes extends Optional<SystemConfigAttributes, 'id' | 'description' | 'isEditable' | 'updatedBy' | 'createdAt' | 'updatedAt'> {}

class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes> implements SystemConfigAttributes {
  public id!: number;
  public configKey!: string;
  public configValue!: string;
  public configType!: 'string' | 'number' | 'boolean' | 'json';
  public category!: 'general' | 'pricing' | 'email' | 'notifications' | 'security' | 'business' | 'fiscal';
  public description?: string;
  public isEditable!: boolean;
  public updatedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    configKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Clave única de configuración',
    },
    configValue: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    configType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      allowNull: false,
      defaultValue: 'string',
    },
    category: {
      type: DataTypes.ENUM('general', 'pricing', 'email', 'notifications', 'security', 'business', 'fiscal'),
      allowNull: false,
      defaultValue: 'general',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isEditable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'system_configs',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['config_key'], unique: true },
      { fields: ['category'] },
    ],
  }
);

export default SystemConfig;
