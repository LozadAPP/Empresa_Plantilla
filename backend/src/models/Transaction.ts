import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TransactionAttributes {
  id: number;
  transactionCode: string;
  transactionType: 'income' | 'expense' | 'transfer';
  accountId: number;
  destinationAccountId?: number; // For transfers: destination account
  amount: number;
  description: string;
  referenceType?: string; // 'rental', 'maintenance', 'payment', etc.
  referenceId?: string; // ID de la entidad relacionada
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  transactionDate: Date;
  status: 'pending' | 'completed' | 'cancelled';
  locationId?: number;
  createdBy: number;
  approvedBy?: number;
  approvedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'destinationAccountId' | 'referenceType' | 'referenceId' | 'paymentMethod' | 'status' | 'locationId' | 'approvedBy' | 'approvedAt' | 'notes' | 'createdAt' | 'updatedAt'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public transactionCode!: string;
  public transactionType!: 'income' | 'expense' | 'transfer';
  public accountId!: number;
  public destinationAccountId?: number;
  public amount!: number;
  public description!: string;
  public referenceType?: string;
  public referenceId?: string;
  public paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  public transactionDate!: Date;
  public status!: 'pending' | 'completed' | 'cancelled';
  public locationId?: number;
  public createdBy!: number;
  public approvedBy?: number;
  public approvedAt?: Date;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transactionCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Código único: TRX-2024-0001',
    },
    transactionType: {
      type: DataTypes.ENUM('income', 'expense', 'transfer'),
      allowNull: false,
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    destinationAccountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
      comment: 'For transfers: destination account ID',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tipo de entidad relacionada',
    },
    referenceId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'ID de la entidad relacionada',
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'transfer', 'check', 'other'),
      allowNull: true,
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
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
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['transaction_code'], unique: true },
      { fields: ['transaction_type'] },
      { fields: ['account_id'] },
      { fields: ['status'] },
      { fields: ['transaction_date'] },
      { fields: ['reference_type', 'reference_id'] },
    ],
  }
);

export default Transaction;
