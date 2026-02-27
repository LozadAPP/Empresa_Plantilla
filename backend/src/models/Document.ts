import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DocumentAttributes {
  id: number;
  documentCode: string;
  name: string;
  description?: string;
  documentType: 'contract' | 'invoice' | 'quote' | 'ficha' | 'movement' | 'upload';
  category: 'legal' | 'financial' | 'operational' | 'technical' | 'general';
  mimeType: string;
  fileSize?: number;
  filePath: string;
  originalName?: string;
  entityType?: string;
  entityId?: number;
  source: 'auto' | 'upload';
  isActive: boolean;
  uploadedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DocumentCreationAttributes extends Optional<DocumentAttributes,
  'id' | 'description' | 'fileSize' | 'originalName' | 'entityType' |
  'entityId' | 'isActive' | 'uploadedBy' | 'createdAt' | 'updatedAt'
> {}

class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: number;
  public documentCode!: string;
  public name!: string;
  public description?: string;
  public documentType!: 'contract' | 'invoice' | 'quote' | 'ficha' | 'movement' | 'upload';
  public category!: 'legal' | 'financial' | 'operational' | 'technical' | 'general';
  public mimeType!: string;
  public fileSize?: number;
  public filePath!: string;
  public originalName?: string;
  public entityType?: string;
  public entityId?: number;
  public source!: 'auto' | 'upload';
  public isActive!: boolean;
  public uploadedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    documentCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Codigo unico: DOC-2026-0001',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    documentType: {
      type: DataTypes.ENUM('contract', 'invoice', 'quote', 'ficha', 'movement', 'upload'),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('legal', 'financial', 'operational', 'technical', 'general'),
      allowNull: false,
      defaultValue: 'general',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'application/pdf',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes',
    },
    filePath: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Original filename for uploads',
    },
    entityType: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: 'vehicle, rental, customer, invoice, quote, inventory_movement',
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM('auto', 'upload'),
      allowNull: false,
      defaultValue: 'auto',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: 'documents',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['document_code'], unique: true },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['document_type'] },
      { fields: ['source'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Document;
