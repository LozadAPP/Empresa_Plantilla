import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum PriceType {
  PER_DAY = 'per_day',
  FIXED = 'fixed'
}

export enum ServiceCategory {
  ACCESSORY = 'accessory',
  INSURANCE = 'insurance',
  SERVICE = 'service'
}

interface ExtraServiceAttributes {
  id: number;
  name: string;
  description?: string;
  price: number;
  price_type: PriceType;
  category: ServiceCategory;
  is_active: boolean;
  vehicle_type_id?: number;
  location_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ExtraServiceCreationAttributes extends Optional<ExtraServiceAttributes, 'id' | 'created_at' | 'updated_at' | 'is_active'> {}

class ExtraService extends Model<ExtraServiceAttributes, ExtraServiceCreationAttributes> implements ExtraServiceAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public price!: number;
  public price_type!: PriceType;
  public category!: ServiceCategory;
  public is_active!: boolean;
  public vehicle_type_id?: number;
  public location_id?: number;
  public created_at!: Date;
  public updated_at!: Date;
}

ExtraService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    price_type: {
      type: DataTypes.ENUM(...Object.values(PriceType)),
      allowNull: false,
      defaultValue: PriceType.PER_DAY
    },
    category: {
      type: DataTypes.ENUM(...Object.values(ServiceCategory)),
      allowNull: false,
      defaultValue: ServiceCategory.ACCESSORY
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    vehicle_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vehicle_types',
        key: 'id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'extra_services',
    timestamps: false
  }
);

export default ExtraService;
