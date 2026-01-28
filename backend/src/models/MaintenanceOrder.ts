import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MaintenanceOrderAttributes {
  id: number;
  maintenanceCode: string;
  vehicleId: number;
  maintenanceTypeId: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: Date;
  startDate?: Date;
  completedDate?: Date;
  description?: string;
  notes?: string;
  actualCost?: number;
  actualDuration?: number; // en horas
  workshopName?: string;
  technicianName?: string;
  mileageAtService?: number;
  nextServiceMileage?: number;
  partsReplaced?: string; // JSON array de repuestos
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MaintenanceOrderCreationAttributes extends Optional<MaintenanceOrderAttributes, 'id' | 'status' | 'priority' | 'startDate' | 'completedDate' | 'description' | 'notes' | 'actualCost' | 'actualDuration' | 'workshopName' | 'technicianName' | 'mileageAtService' | 'nextServiceMileage' | 'partsReplaced' | 'createdAt' | 'updatedAt'> {}

class MaintenanceOrder extends Model<MaintenanceOrderAttributes, MaintenanceOrderCreationAttributes> implements MaintenanceOrderAttributes {
  public id!: number;
  public maintenanceCode!: string;
  public vehicleId!: number;
  public maintenanceTypeId!: number;
  public status!: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  public priority!: 'low' | 'medium' | 'high' | 'critical';
  public scheduledDate!: Date;
  public startDate?: Date;
  public completedDate?: Date;
  public description?: string;
  public notes?: string;
  public actualCost?: number;
  public actualDuration?: number;
  public workshopName?: string;
  public technicianName?: string;
  public mileageAtService?: number;
  public nextServiceMileage?: number;
  public partsReplaced?: string;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MaintenanceOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    maintenanceCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Código único: MNT-2024-0001',
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id',
      },
    },
    maintenanceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'maintenance_types',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actualCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    actualDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duración real en horas',
    },
    workshopName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    technicianName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mileageAtService: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nextServiceMileage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    partsReplaced: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array de repuestos reemplazados',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'maintenance_orders',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['vehicle_id'] },
      { fields: ['status'] },
      { fields: ['scheduled_date'] },
      { fields: ['priority'] },
      { fields: ['maintenance_code'], unique: true },
    ],
  }
);

export default MaintenanceOrder;
