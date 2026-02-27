import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// ============================================
// ENUMS
// ============================================

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadSource {
  WEB = 'web',
  REFERRAL = 'referral',
  COLD_CALL = 'cold_call',
  EVENT = 'event',
  SOCIAL_MEDIA = 'social_media',
  OTHER = 'other',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Pipeline transitions: defines which status can go to which
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.NEW]: [LeadStatus.CONTACTED, LeadStatus.LOST],
  [LeadStatus.CONTACTED]: [LeadStatus.QUALIFIED, LeadStatus.LOST],
  [LeadStatus.QUALIFIED]: [LeadStatus.PROPOSAL, LeadStatus.LOST],
  [LeadStatus.PROPOSAL]: [LeadStatus.NEGOTIATION, LeadStatus.LOST],
  [LeadStatus.NEGOTIATION]: [LeadStatus.WON, LeadStatus.LOST],
  [LeadStatus.WON]: [],
  [LeadStatus.LOST]: [],
};

// ============================================
// INTERFACES
// ============================================

interface LeadAttributes {
  id: number;
  leadCode: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  estimatedValue: number;
  assignedTo?: number;
  customerId?: number;
  notes?: string;
  nextFollowUp?: Date;
  lostReason?: string;
  convertedAt?: Date;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeadCreationAttributes extends Optional<LeadAttributes,
  'id' | 'company' | 'email' | 'phone' | 'source' | 'status' | 'priority' |
  'estimatedValue' | 'assignedTo' | 'customerId' | 'notes' | 'nextFollowUp' |
  'lostReason' | 'convertedAt' | 'createdAt' | 'updatedAt'
> {}

// ============================================
// MODEL
// ============================================

class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  public id!: number;
  public leadCode!: string;
  public name!: string;
  public company?: string;
  public email?: string;
  public phone?: string;
  public source!: LeadSource;
  public status!: LeadStatus;
  public priority!: LeadPriority;
  public estimatedValue!: number;
  public assignedTo?: number;
  public customerId?: number;
  public notes?: string;
  public nextFollowUp?: Date;
  public lostReason?: string;
  public convertedAt?: Date;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Lead.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    leadCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Codigo unico: LID-2026-0001',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM(...Object.values(LeadSource)),
      allowNull: false,
      defaultValue: LeadSource.OTHER,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(LeadStatus)),
      allowNull: false,
      defaultValue: LeadStatus.NEW,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(LeadPriority)),
      allowNull: false,
      defaultValue: LeadPriority.MEDIUM,
    },
    estimatedValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Valor estimado del negocio',
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'customers', key: 'id' },
      comment: 'Set when lead is converted to customer',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextFollowUp: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Proxima fecha de seguimiento',
    },
    lostReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Razon de perdida si status=lost',
    },
    convertedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de conversion a cliente',
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
    tableName: 'leads',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['lead_code'], unique: true },
      { fields: ['status'] },
      { fields: ['source'] },
      { fields: ['priority'] },
      { fields: ['assigned_to'] },
      { fields: ['customer_id'] },
      { fields: ['next_follow_up'] },
    ],
  }
);

export default Lead;
