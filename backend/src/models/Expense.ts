import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ExpenseAttributes {
  id: number;
  expenseCode: string;
  category: 'operacion' | 'vehiculos' | 'financieros' | 'otros';
  subcategory?: string;
  accountId?: number;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  receiptNumber?: string;
  receiptUrl?: string;
  supplierId?: number;
  supplierName?: string;
  supplierRfc?: string;
  expenseDate: Date;
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePeriod?: string;
  referenceType?: string;
  referenceId?: number;
  transactionId?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  locationId?: number;
  createdBy: number;
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes,
  'id' | 'subcategory' | 'accountId' | 'taxAmount' | 'paymentMethod' |
  'receiptNumber' | 'receiptUrl' | 'supplierId' | 'supplierName' | 'supplierRfc' |
  'dueDate' | 'isRecurring' | 'recurrencePeriod' | 'referenceType' |
  'referenceId' | 'transactionId' | 'status' | 'locationId' |
  'approvedBy' | 'approvedAt' | 'rejectionReason' | 'notes' |
  'createdAt' | 'updatedAt'
> {}

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public id!: number;
  public expenseCode!: string;
  public category!: 'operacion' | 'vehiculos' | 'financieros' | 'otros';
  public subcategory?: string;
  public accountId?: number;
  public description!: string;
  public amount!: number;
  public taxAmount!: number;
  public totalAmount!: number;
  public paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  public receiptNumber?: string;
  public receiptUrl?: string;
  public supplierId?: number;
  public supplierName?: string;
  public supplierRfc?: string;
  public expenseDate!: Date;
  public dueDate?: Date;
  public isRecurring!: boolean;
  public recurrencePeriod?: string;
  public referenceType?: string;
  public referenceId?: number;
  public transactionId?: number;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
  public locationId?: number;
  public createdBy!: number;
  public approvedBy?: number;
  public approvedAt?: Date;
  public rejectionReason?: string;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expenseCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Codigo unico: EGR-2026-0001',
    },
    category: {
      type: DataTypes.ENUM('operacion', 'vehiculos', 'financieros', 'otros'),
      allowNull: false,
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'accounts', key: 'id' },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'transfer', 'check', 'other'),
      allowNull: true,
    },
    receiptNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    receiptUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'suppliers', key: 'id' },
    },
    supplierName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    supplierRfc: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurrencePeriod: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'monthly, quarterly, yearly',
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'vehicle, maintenance, location, etc.',
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'transactions', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'locations', key: 'id' },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['expense_code'], unique: true },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['expense_date'] },
      { fields: ['location_id'] },
      { fields: ['account_id'] },
      { fields: ['supplier_id'] },
    ],
  }
);

export default Expense;
