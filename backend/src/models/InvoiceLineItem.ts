import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InvoiceLineItemAttributes {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  discount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  satProductCode: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvoiceLineItemCreationAttributes extends Optional<InvoiceLineItemAttributes, 'id' | 'discount' | 'sortOrder' | 'createdAt' | 'updatedAt'> {}

class InvoiceLineItem extends Model<InvoiceLineItemAttributes, InvoiceLineItemCreationAttributes> implements InvoiceLineItemAttributes {
  public id!: number;
  public invoiceId!: number;
  public description!: string;
  public quantity!: number;
  public unitCode!: string;
  public unitPrice!: number;
  public discount!: number;
  public subtotal!: number;
  public taxRate!: number;
  public taxAmount!: number;
  public total!: number;
  public satProductCode!: string;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InvoiceLineItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      validate: { min: 0 },
    },
    unitCode: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'E48',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 16,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    satProductCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '78111802',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'invoice_line_items',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['invoice_id'] },
    ],
  }
);

export default InvoiceLineItem;
