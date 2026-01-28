import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserRoleAttributes {
  id: number;
  user_id: number;
  role_id: number;
  location_id?: number;
}

interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id'> {}

class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public id!: number;
  public user_id!: number;
  public role_id!: number;
  public location_id?: number;
}

UserRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'user_roles',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id', 'location_id']
      }
    ]
  }
);

export default UserRole;
