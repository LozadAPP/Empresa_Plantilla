import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MaintenanceTypeAttributes {
  id: number;
  name: string;
  description?: string;
  estimatedCost: number;
  estimatedDuration: number; // en horas
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MaintenanceTypeCreationAttributes extends Optional<MaintenanceTypeAttributes, 'id' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class MaintenanceType extends Model<MaintenanceTypeAttributes, MaintenanceTypeCreationAttributes> implements MaintenanceTypeAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public estimatedCost!: number;
  public estimatedDuration!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MaintenanceType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimatedCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Duración estimada en horas',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'maintenance_types',
    timestamps: true,
    underscored: true,
  }
);

export default MaintenanceType;
