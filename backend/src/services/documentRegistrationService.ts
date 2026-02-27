import fs from 'fs';
import Document from '../models/Document';
import { CodeGenerator } from './codeGenerator';
import logger from '../config/logger';

type AutoDocumentType = 'contract' | 'invoice' | 'quote' | 'ficha' | 'movement';

const TYPE_TO_CATEGORY: Record<AutoDocumentType, 'legal' | 'financial' | 'operational' | 'technical'> = {
  contract: 'legal',
  invoice: 'financial',
  quote: 'financial',
  ficha: 'technical',
  movement: 'operational',
};

interface RegisterOptions {
  documentType: AutoDocumentType;
  name: string;
  filePath: string;
  entityType: string;
  entityId: number;
  userId?: number;
}

export class DocumentRegistrationService {
  /**
   * Register an auto-generated PDF in the documents table.
   * Idempotent: uses findOrCreate keyed on entityType + entityId + documentType.
   * Fire-and-forget: errors are logged but never thrown.
   */
  static async registerAutoDocument(options: RegisterOptions): Promise<void> {
    try {
      const { documentType, name, filePath, entityType, entityId, userId } = options;

      let fileSize: number | undefined;
      try {
        fileSize = fs.statSync(filePath).size;
      } catch {
        // File might not exist yet in some edge cases
      }

      const documentCode = await CodeGenerator.generateDocumentCode();

      await Document.findOrCreate({
        where: {
          entityType,
          entityId,
          documentType,
        },
        defaults: {
          documentCode,
          name,
          documentType,
          category: TYPE_TO_CATEGORY[documentType],
          mimeType: 'application/pdf',
          fileSize,
          filePath,
          source: 'auto',
          isActive: true,
          uploadedBy: userId,
        },
      });
    } catch (error) {
      logger.warn('Failed to register auto-generated document:', error);
    }
  }
}
