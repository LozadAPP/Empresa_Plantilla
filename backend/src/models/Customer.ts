import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CustomerAttributes {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  customer_type: 'individual' | 'corporate' | 'government';
  credit_limit: number;
  payment_terms: number; // Days to pay (Net 30, Net 60, etc.)
  discount_percentage: number;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'customer_type' | 'credit_limit' | 'payment_terms' | 'discount_percentage' | 'current_balance' | 'is_active' | 'created_at' | 'updated_at'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public contact_person?: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public city?: string;
  public country?: string;
  public tax_id?: string;
  public customer_type!: 'individual' | 'corporate' | 'government';
  public credit_limit!: number;
  public payment_terms!: number;
  public discount_percentage!: number;
  public current_balance!: number;
  public is_active!: boolean;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contact_person: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tax_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    customer_type: {
      type: DataTypes.ENUM('individual', 'corporate', 'government'),
      defaultValue: 'individual'
    },
    credit_limit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    payment_terms: {
      type: DataTypes.INTEGER,
      defaultValue: 30 // Net 30 by default
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    current_balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'customers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['email'] },
      { fields: ['name'] },
      { fields: ['customer_type'] },
      { fields: ['is_active'] }
    ]
  }
);

export default Customer;
