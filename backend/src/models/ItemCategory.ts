import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ItemCategoryAttributes {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  types: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemCategoryCreationAttributes
  extends Optional<ItemCategoryAttributes, 'id' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class ItemCategory extends Model<ItemCategoryAttributes, ItemCategoryCreationAttributes> implements ItemCategoryAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public description?: string;
  public icon!: string;
  public color!: string;
  public types!: string[];
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ItemCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    types: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'item_categories',
    timestamps: true,
    underscored: true,
  }
);

export default ItemCategory;
