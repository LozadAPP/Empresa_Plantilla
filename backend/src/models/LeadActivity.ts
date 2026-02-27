import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// ============================================
// ENUMS
// ============================================

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  NOTE = 'note',
  FOLLOW_UP = 'follow_up',
  PROPOSAL = 'proposal',
}

// ============================================
// INTERFACES
// ============================================

interface LeadActivityAttributes {
  id: number;
  leadId: number;
  activityType: ActivityType;
  description: string;
  scheduledAt?: Date;
  completedAt?: Date;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeadActivityCreationAttributes extends Optional<LeadActivityAttributes,
  'id' | 'scheduledAt' | 'completedAt' | 'createdAt' | 'updatedAt'
> {}

// ============================================
// MODEL
// ============================================

class LeadActivity extends Model<LeadActivityAttributes, LeadActivityCreationAttributes> implements LeadActivityAttributes {
  public id!: number;
  public leadId!: number;
  public activityType!: ActivityType;
  public description!: string;
  public scheduledAt?: Date;
  public completedAt?: Date;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeadActivity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'leads', key: 'id' },
    },
    activityType: {
      type: DataTypes.ENUM(...Object.values(ActivityType)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
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
    tableName: 'lead_activities',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['lead_id'] },
      { fields: ['activity_type'] },
      { fields: ['scheduled_at'] },
    ],
  }
);

export default LeadActivity;
