import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface LocationAttributes {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'warehouse' | 'customer' | 'office' | 'maintenance' | 'other';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationCreationAttributes
  extends Optional<LocationAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Location extends Model<LocationAttributes, LocationCreationAttributes> implements LocationAttributes {
  public id!: number;
  public name!: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public country!: string;
  public zipCode?: string;
  public coordinates!: { lat: number; lng: number };
  public type!: 'warehouse' | 'customer' | 'office' | 'maintenance' | 'other';
  public contactName?: string;
  public contactPhone?: string;
  public contactEmail?: string;
  public notes?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Location.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'México',
    },
    zipCode: {
      type: DataTypes.STRING,
    },
    coordinates: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('warehouse', 'customer', 'office', 'maintenance', 'other'),
      allowNull: false,
      defaultValue: 'warehouse',
    },
    contactName: {
      type: DataTypes.STRING,
    },
    contactPhone: {
      type: DataTypes.STRING,
    },
    contactEmail: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'locations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['is_active'] }
    ]
  }
);

export default Location;
