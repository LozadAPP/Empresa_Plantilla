import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

interface InvoiceAttributes {
  id: number;
  invoice_code: string;
  rental_id: number;
  customer_id: number;
  issue_date: Date;
  due_date: Date;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount?: number;
  balance: number;
  status: InvoiceStatus;
  notes?: string;
  pdf_url?: string;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: number;
  public invoice_code!: string;
  public rental_id!: number;
  public customer_id!: number;
  public issue_date!: Date;
  public due_date!: Date;
  public subtotal!: number;
  public tax_amount!: number;
  public discount_amount?: number;
  public total_amount!: number;
  public paid_amount?: number;
  public balance!: number;
  public status!: InvoiceStatus;
  public notes?: string;
  public pdf_url?: string;
  public created_by?: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    invoice_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    rental_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rentals',
        key: 'id'
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
      allowNull: false,
      defaultValue: InvoiceStatus.DRAFT
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pdf_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
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
    tableName: 'invoices',
    timestamps: false,
    indexes: [
      { fields: ['rental_id'] },
      { fields: ['customer_id'] },
      { fields: ['status'] },
      { fields: ['due_date'] },
      { fields: ['issue_date'] }
    ]
  }
);

export default Invoice;
