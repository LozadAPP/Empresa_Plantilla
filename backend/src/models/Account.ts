import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AccountAttributes {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parentAccountId?: number;
  balance: number;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'parentAccountId' | 'balance' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: number;
  public accountCode!: string;
  public accountName!: string;
  public accountType!: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  public parentAccountId?: number;
  public balance!: number;
  public description?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    accountCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Código contable: 1100, 4100, etc.',
    },
    accountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    accountType: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'income', 'expense'),
      allowNull: false,
      comment: 'Tipo de cuenta contable',
    },
    parentAccountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
      comment: 'Para cuentas jerárquicas (subcuentas)',
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['account_code'], unique: true },
      { fields: ['account_type'] },
      { fields: ['is_active'] },
    ],
  }
);

export default Account;
