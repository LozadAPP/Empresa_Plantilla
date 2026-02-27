import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SupplierAttributes {
  id: number;
  supplierCode: string;
  name: string;
  rfc?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  supplierType: 'services' | 'products' | 'both';
  category?: string;
  bankName?: string;
  bankAccount?: string;
  clabe?: string;
  paymentTerms: number;
  creditLimit: number;
  isActive: boolean;
  rating?: number;
  notes?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SupplierCreationAttributes extends Optional<SupplierAttributes,
  'id' | 'rfc' | 'contactPerson' | 'email' | 'phone' | 'address' |
  'city' | 'state' | 'country' | 'zipCode' | 'supplierType' | 'category' |
  'bankName' | 'bankAccount' | 'clabe' | 'paymentTerms' | 'creditLimit' |
  'isActive' | 'rating' | 'notes' | 'createdAt' | 'updatedAt'
> {}

class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> implements SupplierAttributes {
  public id!: number;
  public supplierCode!: string;
  public name!: string;
  public rfc?: string;
  public contactPerson?: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public zipCode?: string;
  public supplierType!: 'services' | 'products' | 'both';
  public category?: string;
  public bankName?: string;
  public bankAccount?: string;
  public clabe?: string;
  public paymentTerms!: number;
  public creditLimit!: number;
  public isActive!: boolean;
  public rating?: number;
  public notes?: string;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Supplier.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplierCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Codigo unico: SUP-2026-0001',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rfc: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'México',
    },
    zipCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    supplierType: {
      type: DataTypes.ENUM('services', 'products', 'both'),
      allowNull: false,
      defaultValue: 'services',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bankAccount: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    clabe: {
      type: DataTypes.STRING(18),
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Dias de credito',
    },
    creditLimit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '1-5 estrellas',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
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
    tableName: 'suppliers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['supplier_code'], unique: true },
      { fields: ['name'] },
      { fields: ['rfc'] },
      { fields: ['supplier_type'] },
      { fields: ['is_active'] },
    ],
  }
);

export default Supplier;
