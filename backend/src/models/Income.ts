import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum IncomeCategory {
  RENTAL = 'rental',
  PENALTY = 'penalty',
  INSURANCE = 'insurance',
  EXTRAS = 'extras',
  OTHER = 'other'
}

interface IncomeAttributes {
  id: number;
  income_code: string;
  rental_id?: number;
  payment_id?: number;
  category: IncomeCategory;
  amount: number;
  description: string;
  transaction_date: Date;
  location_id: number;
  recorded_by?: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface IncomeCreationAttributes extends Optional<IncomeAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Income extends Model<IncomeAttributes, IncomeCreationAttributes> implements IncomeAttributes {
  public id!: number;
  public income_code!: string;
  public rental_id?: number;
  public payment_id?: number;
  public category!: IncomeCategory;
  public amount!: number;
  public description!: string;
  public transaction_date!: Date;
  public location_id!: number;
  public recorded_by?: number;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Income.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    income_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    rental_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rentals',
        key: 'id'
      }
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.ENUM(...Object.values(IncomeCategory)),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    tableName: 'incomes',
    timestamps: false
  }
);

export default Income;
