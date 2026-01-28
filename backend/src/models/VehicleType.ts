import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface VehicleTypeAttributes {
  id: number;
  name: string;
  description?: string;
  daily_rate: number;
}

interface VehicleTypeCreationAttributes extends Optional<VehicleTypeAttributes, 'id'> {}

class VehicleType extends Model<VehicleTypeAttributes, VehicleTypeCreationAttributes> implements VehicleTypeAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public daily_rate!: number;
}

VehicleType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'vehicle_types',
    timestamps: false
  }
);

export default VehicleType;
