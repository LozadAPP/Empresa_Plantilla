import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RentalServiceAttributes {
  id: number;
  rental_id: number;
  extra_service_id: number;
  quantity: number;
  unit_price: number;
  days: number;
  subtotal: number;
  created_at?: Date;
}

interface RentalServiceCreationAttributes extends Optional<RentalServiceAttributes, 'id' | 'created_at'> {}

class RentalService extends Model<RentalServiceAttributes, RentalServiceCreationAttributes> implements RentalServiceAttributes {
  public id!: number;
  public rental_id!: number;
  public extra_service_id!: number;
  public quantity!: number;
  public unit_price!: number;
  public days!: number;
  public subtotal!: number;
  public created_at!: Date;
}

RentalService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    rental_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rentals',
        key: 'id'
      }
    },
    extra_service_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'extra_services',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Precio al momento de la renta'
    },
    days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Días aplicables si es per_day'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'quantity * unit_price * days'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'rental_services',
    timestamps: false
  }
);

export default RentalService;
