import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TransactionLineAttributes {
  id: number;
  transactionId: number;
  accountId: number;
  debit: number;
  credit: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionLineCreationAttributes extends Optional<TransactionLineAttributes, 'id' | 'debit' | 'credit' | 'description' | 'createdAt' | 'updatedAt'> {}

class TransactionLine extends Model<TransactionLineAttributes, TransactionLineCreationAttributes> implements TransactionLineAttributes {
  public id!: number;
  public transactionId!: number;
  public accountId!: number;
  public debit!: number;
  public credit!: number;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TransactionLine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
      comment: 'FK al encabezado del asiento contable',
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
      comment: 'Cuenta contable afectada por esta línea',
    },
    debit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    credit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Descripción opcional por línea',
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
    tableName: 'transaction_lines',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['transaction_id'] },
      { fields: ['account_id'] },
    ],
  }
);

export default TransactionLine;
