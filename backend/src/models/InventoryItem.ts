import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface InventoryItemAttributes {
  id: number;
  name: string;
  // Categorización
  categoryId: number;
  categoryName: string;
  type: string;
  // Identificación
  serialNumber: string;
  internalCode?: string;
  // Ubicación Actual (denormalizado para queries rápidas)
  currentLocationId: number;
  currentLocationName: string;
  currentLocationCity: string;
  currentLocationState: string;
  currentLocationCoordinates: { lat: number; lng: number };
  // Cliente/Empresa Actual (si está rentado)
  currentCustomerId?: number;
  currentCompany?: string;
  // Estado
  status: 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  // Valores
  purchasePrice?: number;
  currentValue: number;
  rentalPriceDaily?: number;
  // Fechas
  purchaseDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  lastMovementDate?: Date;
  // Campos personalizados por categoría (JSON flexible)
  customFields: Record<string, any>;
  // Metadata
  photos?: string[];
  documents?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemCreationAttributes
  extends Optional<InventoryItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class InventoryItem extends Model<InventoryItemAttributes, InventoryItemCreationAttributes> implements InventoryItemAttributes {
  public id!: number;
  public name!: string;
  public categoryId!: number;
  public categoryName!: string;
  public type!: string;
  public serialNumber!: string;
  public internalCode?: string;
  public currentLocationId!: number;
  public currentLocationName!: string;
  public currentLocationCity!: string;
  public currentLocationState!: string;
  public currentLocationCoordinates!: { lat: number; lng: number };
  public currentCustomerId?: number;
  public currentCompany?: string;
  public status!: 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
  public condition!: 'excellent' | 'good' | 'fair' | 'poor';
  public purchasePrice?: number;
  public currentValue!: number;
  public rentalPriceDaily?: number;
  public purchaseDate?: Date;
  public lastMaintenanceDate?: Date;
  public nextMaintenanceDate?: Date;
  public lastMovementDate?: Date;
  public customFields!: Record<string, any>;
  public photos?: string[];
  public documents?: string[];
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryItem.init(
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
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
    },
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'category_name',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'serial_number',
    },
    internalCode: {
      type: DataTypes.STRING,
      field: 'internal_code',
    },
    currentLocationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'current_location_id',
    },
    currentLocationName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'current_location_name',
    },
    currentLocationCity: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'current_location_city',
    },
    currentLocationState: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'current_location_state',
    },
    currentLocationCoordinates: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'current_location_coordinates',
    },
    currentCustomerId: {
      type: DataTypes.INTEGER,
      field: 'current_customer_id',
    },
    currentCompany: {
      type: DataTypes.STRING,
      field: 'current_company',
    },
    status: {
      type: DataTypes.ENUM('available', 'rented', 'maintenance', 'sold', 'retired'),
      allowNull: false,
      defaultValue: 'available',
    },
    condition: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      allowNull: false,
      defaultValue: 'excellent',
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'purchase_price',
    },
    currentValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'current_value',
    },
    rentalPriceDaily: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'rental_price_daily',
    },
    purchaseDate: {
      type: DataTypes.DATE,
      field: 'purchase_date',
    },
    lastMaintenanceDate: {
      type: DataTypes.DATE,
      field: 'last_maintenance_date',
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      field: 'next_maintenance_date',
    },
    lastMovementDate: {
      type: DataTypes.DATE,
      field: 'last_movement_date',
    },
    customFields: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'custom_fields',
    },
    photos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    documents: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'inventory_items',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['category_id'] },
      { fields: ['current_location_id'] },
      { fields: ['status'] },
      { fields: ['condition'] },
      { fields: ['type'] }
    ]
  }
);

export default InventoryItem;
