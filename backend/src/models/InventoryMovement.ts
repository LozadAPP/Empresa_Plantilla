import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface InventoryMovementAttributes {
  id: number;
  movementNumber: string;
  // Artículo
  itemId: number;
  itemName: string;
  itemCategory: string;
  itemSerialNumber: string;
  // Tipo de Movimiento
  movementType: 'entry' | 'exit' | 'transfer';
  movementSubtype: 'rental' | 'sale' | 'purchase' | 'return' | 'transfer' | 'maintenance';
  // Ubicaciones
  fromLocationId?: number;
  fromLocationName?: string;
  fromLocationAddress?: string;
  fromLocationCoordinates?: { lat: number; lng: number };
  toLocationId: number;
  toLocationName: string;
  toLocationAddress: string;
  toLocationCity: string;
  toLocationState: string;
  toLocationCoordinates: { lat: number; lng: number };
  // Cliente/Empresa (si aplica)
  customerId?: number;
  customerName?: string;
  customerCompany?: string;
  // Fechas
  movementDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  // Documento generado
  documentGenerated: boolean;
  documentType?: 'entry' | 'exit';
  documentNumber?: string;
  documentUrl?: string;
  // Valores (si aplica)
  rentalPrice?: number;
  salePrice?: number;
  purchasePrice?: number;
  // Metadata
  notes?: string;
  userId: number;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovementCreationAttributes
  extends Optional<InventoryMovementAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class InventoryMovement extends Model<InventoryMovementAttributes, InventoryMovementCreationAttributes> implements InventoryMovementAttributes {
  public id!: number;
  public movementNumber!: string;
  public itemId!: number;
  public itemName!: string;
  public itemCategory!: string;
  public itemSerialNumber!: string;
  public movementType!: 'entry' | 'exit' | 'transfer';
  public movementSubtype!: 'rental' | 'sale' | 'purchase' | 'return' | 'transfer' | 'maintenance';
  public fromLocationId?: number;
  public fromLocationName?: string;
  public fromLocationAddress?: string;
  public fromLocationCoordinates?: { lat: number; lng: number };
  public toLocationId!: number;
  public toLocationName!: string;
  public toLocationAddress!: string;
  public toLocationCity!: string;
  public toLocationState!: string;
  public toLocationCoordinates!: { lat: number; lng: number };
  public customerId?: number;
  public customerName?: string;
  public customerCompany?: string;
  public movementDate!: Date;
  public expectedReturnDate?: Date;
  public actualReturnDate?: Date;
  public documentGenerated!: boolean;
  public documentType?: 'entry' | 'exit';
  public documentNumber?: string;
  public documentUrl?: string;
  public rentalPrice?: number;
  public salePrice?: number;
  public purchasePrice?: number;
  public notes?: string;
  public userId!: number;
  public userName!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryMovement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    movementNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'movement_number',
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'item_id',
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'item_name',
    },
    itemCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'item_category',
    },
    itemSerialNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'item_serial_number',
    },
    movementType: {
      type: DataTypes.ENUM('entry', 'exit', 'transfer'),
      allowNull: false,
      field: 'movement_type',
    },
    movementSubtype: {
      type: DataTypes.ENUM('rental', 'sale', 'purchase', 'return', 'transfer', 'maintenance'),
      allowNull: false,
      field: 'movement_subtype',
    },
    fromLocationId: {
      type: DataTypes.INTEGER,
      field: 'from_location_id',
    },
    fromLocationName: {
      type: DataTypes.STRING,
      field: 'from_location_name',
    },
    fromLocationAddress: {
      type: DataTypes.STRING,
      field: 'from_location_address',
    },
    fromLocationCoordinates: {
      type: DataTypes.JSONB,
      field: 'from_location_coordinates',
    },
    toLocationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'to_location_id',
    },
    toLocationName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'to_location_name',
    },
    toLocationAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'to_location_address',
    },
    toLocationCity: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'to_location_city',
    },
    toLocationState: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'to_location_state',
    },
    toLocationCoordinates: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'to_location_coordinates',
    },
    customerId: {
      type: DataTypes.INTEGER,
      field: 'customer_id',
    },
    customerName: {
      type: DataTypes.STRING,
      field: 'customer_name',
    },
    customerCompany: {
      type: DataTypes.STRING,
      field: 'customer_company',
    },
    movementDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'movement_date',
    },
    expectedReturnDate: {
      type: DataTypes.DATE,
      field: 'expected_return_date',
    },
    actualReturnDate: {
      type: DataTypes.DATE,
      field: 'actual_return_date',
    },
    documentGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'document_generated',
    },
    documentType: {
      type: DataTypes.ENUM('entry', 'exit'),
      field: 'document_type',
    },
    documentNumber: {
      type: DataTypes.STRING,
      field: 'document_number',
    },
    documentUrl: {
      type: DataTypes.STRING,
      field: 'document_url',
    },
    rentalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'rental_price',
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'sale_price',
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'purchase_price',
    },
    notes: {
      type: DataTypes.TEXT,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'user_name',
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
    tableName: 'inventory_movements',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['item_id'] },
      { fields: ['movement_type'] },
      { fields: ['movement_date'] },
      { fields: ['to_location_id'] },
      { fields: ['from_location_id'] }
    ]
  }
);

export default InventoryMovement;
