import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum VehicleCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged'
}

interface ReturnAttributes {
  id: number;
  return_code: string;
  rental_id: number;
  vehicle_id: number;
  return_date: Date;
  return_location_id: number;
  end_mileage: number;
  fuel_level: string;
  vehicle_condition: VehicleCondition;
  is_on_time: boolean;
  days_late?: number;
  late_fee?: number;
  damage_description?: string;
  damage_cost?: number;
  cleaning_required: boolean;
  cleaning_cost?: number;
  total_penalty?: number;
  inspected_by?: number;
  inspection_notes?: string;
  photos?: string[];
  created_at?: Date;
  updated_at?: Date;
}

interface ReturnCreationAttributes extends Optional<ReturnAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Return extends Model<ReturnAttributes, ReturnCreationAttributes> implements ReturnAttributes {
  public id!: number;
  public return_code!: string;
  public rental_id!: number;
  public vehicle_id!: number;
  public return_date!: Date;
  public return_location_id!: number;
  public end_mileage!: number;
  public fuel_level!: string;
  public vehicle_condition!: VehicleCondition;
  public is_on_time!: boolean;
  public days_late?: number;
  public late_fee?: number;
  public damage_description?: string;
  public damage_cost?: number;
  public cleaning_required!: boolean;
  public cleaning_cost?: number;
  public total_penalty?: number;
  public inspected_by?: number;
  public inspection_notes?: string;
  public photos?: string[];
  public created_at!: Date;
  public updated_at!: Date;
}

Return.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    return_code: {
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
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    return_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    return_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    end_mileage: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fuel_level: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    vehicle_condition: {
      type: DataTypes.ENUM(...Object.values(VehicleCondition)),
      allowNull: false
    },
    is_on_time: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    days_late: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    late_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    damage_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    damage_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    cleaning_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    cleaning_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    total_penalty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    inspected_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    inspection_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    photos: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
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
    tableName: 'returns',
    timestamps: false,
    indexes: [
      { fields: ['rental_id'] },
      { fields: ['vehicle_id'] },
      { fields: ['return_location_id'] },
      { fields: ['return_date'] },
      { fields: ['vehicle_condition'] }
    ]
  }
);

export default Return;
