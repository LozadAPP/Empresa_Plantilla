import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CONVERTED = 'converted'
}

interface QuoteAttributes {
  id: number;
  quote_code: string;
  customer_id: number;
  vehicle_id?: number;
  location_id?: number;

  // Fechas de la renta cotizada
  start_date?: Date;
  end_date?: Date;
  days?: number;

  // Cálculos (misma estructura que rentals)
  daily_rate?: number;
  subtotal: number;
  discount_percentage?: number;
  discount_amount?: number;
  insurance_amount?: number;
  extras_amount?: number;
  shipping_cost?: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  deposit_amount?: number;

  // Estado y vigencia
  status: QuoteStatus;
  valid_until: Date;

  // Conversión a renta
  converted_rental_id?: number;

  // Metadatos
  notes?: string;
  customer_notes?: string;
  pdf_url?: string;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface QuoteCreationAttributes extends Optional<QuoteAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Quote extends Model<QuoteAttributes, QuoteCreationAttributes> implements QuoteAttributes {
  public id!: number;
  public quote_code!: string;
  public customer_id!: number;
  public vehicle_id?: number;
  public location_id?: number;

  public start_date?: Date;
  public end_date?: Date;
  public days?: number;

  public daily_rate?: number;
  public subtotal!: number;
  public discount_percentage?: number;
  public discount_amount?: number;
  public insurance_amount?: number;
  public extras_amount?: number;
  public shipping_cost?: number;
  public tax_percentage!: number;
  public tax_amount!: number;
  public total_amount!: number;
  public deposit_amount?: number;

  public status!: QuoteStatus;
  public valid_until!: Date;

  public converted_rental_id?: number;

  public notes?: string;
  public customer_notes?: string;
  public pdf_url?: string;
  public created_by?: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Quote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    quote_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'customers', key: 'id' }
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'vehicles', key: 'id' }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'locations', key: 'id' }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    days: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    insurance_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    extras_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    shipping_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 16
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM(...Object.values(QuoteStatus)),
      allowNull: false,
      defaultValue: QuoteStatus.DRAFT
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: false
    },
    converted_rental_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'rentals', key: 'id' }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customer_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas del cliente (razón de rechazo, etc.)'
    },
    pdf_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
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
    tableName: 'quotes',
    timestamps: false
  }
);

export default Quote;
