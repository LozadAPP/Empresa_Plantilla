import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PriceConfigAttributes {
  id: number;
  vehicleTypeId?: number;
  locationId?: number;
  season?: 'low' | 'regular' | 'high' | 'peak';
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  minimumRentalDays?: number;
  discountPercentage?: number;
  extraHourRate?: number;
  extraDayRate?: number;
  insuranceRate?: number;
  depositAmount?: number;
  lateFeePerDay?: number;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  isActive: boolean;
  notes?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PriceConfigCreationAttributes extends Optional<PriceConfigAttributes, 'id' | 'vehicleTypeId' | 'locationId' | 'season' | 'weeklyRate' | 'monthlyRate' | 'minimumRentalDays' | 'discountPercentage' | 'extraHourRate' | 'extraDayRate' | 'insuranceRate' | 'depositAmount' | 'lateFeePerDay' | 'effectiveUntil' | 'isActive' | 'notes' | 'createdAt' | 'updatedAt'> {}

class PriceConfig extends Model<PriceConfigAttributes, PriceConfigCreationAttributes> implements PriceConfigAttributes {
  public id!: number;
  public vehicleTypeId?: number;
  public locationId?: number;
  public season?: 'low' | 'regular' | 'high' | 'peak';
  public dailyRate!: number;
  public weeklyRate?: number;
  public monthlyRate?: number;
  public minimumRentalDays?: number;
  public discountPercentage?: number;
  public extraHourRate?: number;
  public extraDayRate?: number;
  public insuranceRate?: number;
  public depositAmount?: number;
  public lateFeePerDay?: number;
  public effectiveFrom!: Date;
  public effectiveUntil?: Date;
  public isActive!: boolean;
  public notes?: string;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PriceConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vehicleTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vehicle_types',
        key: 'id',
      },
      comment: 'Null = aplica a todos los tipos',
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id',
      },
      comment: 'Null = aplica a todas las sedes',
    },
    season: {
      type: DataTypes.ENUM('low', 'regular', 'high', 'peak'),
      allowNull: true,
      comment: 'Temporada para precios diferenciados',
    },
    dailyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    weeklyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    monthlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    minimumRentalDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Descuento por temporada o promoción',
    },
    extraHourRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    extraDayRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    insuranceRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    depositAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    lateFeePerDay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    effectiveUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'price_configs',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['vehicle_type_id'] },
      { fields: ['location_id'] },
      { fields: ['effective_from'] },
      { fields: ['is_active'] },
    ],
  }
);

export default PriceConfig;
