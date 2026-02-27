import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../types';
import Document from '../models/Document';
import User from '../models/User';
import { CodeGenerator } from '../services/codeGenerator';
import { createAuditLog } from '../utils/auditLogger';
import logger from '../config/logger';

class DocumentController {
  /**
   * GET /documents — List with pagination + filters
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const {
        page = '1',
        limit = '20',
        document_type,
        category,
        entity_type,
        entity_id,
        source,
        search,
        date_from,
        date_to,
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = { isActive: true };
      if (document_type) where.documentType = document_type;
      if (category) where.category = category;
      if (entity_type) where.entityType = entity_type;
      if (entity_id) where.entityId = parseInt(entity_id as string, 10);
      if (source) where.source = source;
      if (search) {
        where[Op.or as unknown as string] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { documentCode: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }
      if (date_from || date_to) {
        const dateFilter: Record<symbol, unknown> = {};
        if (date_from) dateFilter[Op.gte] = new Date(date_from as string);
        if (date_to) dateFilter[Op.lte] = new Date(date_to as string);
        where.createdAt = dateFilter;
      }

      const { rows, count } = await Document.findAndCountAll({
        where,
        include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name'] }],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          pages: Math.ceil(count / limitNum),
        },
      });
    } catch (error) {
      logger.error('Error fetching documents:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener documentos' });
    }
  }

  /**
   * GET /documents/statistics — KPI data
   */
  async getStatistics(_req: AuthRequest, res: Response) {
    try {
      const [total, autoCount, uploadCount, sizeResult] = await Promise.all([
        Document.count({ where: { isActive: true } }),
        Document.count({ where: { isActive: true, source: 'auto' } }),
        Document.count({ where: { isActive: true, source: 'upload' } }),
        Document.sum('fileSize', { where: { isActive: true } }),
      ]);

      const byType = await Document.findAll({
        attributes: [
          'documentType',
          [Document.sequelize!.fn('COUNT', Document.sequelize!.col('id')), 'count'],
        ],
        where: { isActive: true },
        group: ['documentType'],
        raw: true,
      }) as unknown as Array<{ documentType: string; count: string }>;

      const byTypeMap: Record<string, number> = {};
      byType.forEach((row) => { byTypeMap[row.documentType] = parseInt(row.count, 10); });

      return res.json({
        success: true,
        data: {
          total,
          auto: autoCount,
          upload: uploadCount,
          totalSize: sizeResult || 0,
          byType: byTypeMap,
        },
      });
    } catch (error) {
      logger.error('Error fetching document statistics:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
  }

  /**
   * GET /documents/entity/:entityType/:entityId — Documents by entity
   */
  async getByEntity(req: AuthRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const documents = await Document.findAll({
        where: { entityType, entityId: parseInt(entityId, 10), isActive: true },
        include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name'] }],
        order: [['createdAt', 'DESC']],
      });
      return res.json({ success: true, data: documents });
    } catch (error) {
      logger.error('Error fetching documents by entity:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener documentos' });
    }
  }

  /**
   * GET /documents/:id — Single document metadata
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const document = await Document.findByPk(req.params.id, {
        include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name'] }],
      });
      if (!document || !document.isActive) {
        return res.status(404).json({ success: false, message: 'Documento no encontrado' });
      }
      return res.json({ success: true, data: document });
    } catch (error) {
      logger.error('Error fetching document:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener documento' });
    }
  }

  /**
   * POST /documents/upload — Upload file + create Document record
   */
  async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se proporcionó ningún archivo' });
      }

      const { name, description, category, entity_type, entity_id } = req.body;
      const file = req.file;

      const documentCode = await CodeGenerator.generateDocumentCode();
      const document = await Document.create({
        documentCode,
        name: name || file.originalname,
        description: description || undefined,
        documentType: 'upload',
        category: category || 'general',
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        originalName: file.originalname,
        entityType: entity_type || undefined,
        entityId: entity_id ? parseInt(entity_id, 10) : undefined,
        source: 'upload',
        isActive: true,
        uploadedBy: req.user?.id,
      });

      createAuditLog({
        userId: req.user?.id || 0,
        action: 'create',
        entityType: 'document',
        entityId: document.id,
        newValues: { documentCode, fileName: file.originalname, entityType: entity_type, entityId: entity_id },
      }).catch(() => {});

      logger.info(`Document uploaded: ${documentCode} by user ${req.user?.id}`);
      return res.status(201).json({ success: true, data: document, message: 'Documento subido exitosamente' });
    } catch (error) {
      logger.error('Error uploading document:', error);
      return res.status(500).json({ success: false, message: 'Error al subir documento' });
    }
  }

  /**
   * GET /documents/:id/download — Download file
   */
  async download(req: AuthRequest, res: Response) {
    try {
      const document = await Document.findByPk(req.params.id);
      if (!document || !document.isActive) {
        return res.status(404).json({ success: false, message: 'Documento no encontrado' });
      }

      const filePath = document.filePath;
      if (!fs.existsSync(filePath)) {
        logger.warn(`Document file not found on disk: ${filePath}`);
        return res.status(404).json({ success: false, message: 'Archivo no encontrado en el servidor' });
      }

      const downloadName = document.originalName || `${document.documentCode}${path.extname(filePath)}`;
      return res.download(filePath, downloadName);
    } catch (error) {
      logger.error('Error downloading document:', error);
      return res.status(500).json({ success: false, message: 'Error al descargar documento' });
    }
  }

  /**
   * PUT /documents/:id — Update metadata
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const document = await Document.findByPk(req.params.id);
      if (!document || !document.isActive) {
        return res.status(404).json({ success: false, message: 'Documento no encontrado' });
      }

      const { name, description, category } = req.body;
      await document.update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
      });

      createAuditLog({
        userId: req.user?.id || 0,
        action: 'update',
        entityType: 'document',
        entityId: document.id,
        newValues: { name, description, category },
      }).catch(() => {});

      return res.json({ success: true, data: document, message: 'Documento actualizado' });
    } catch (error) {
      logger.error('Error updating document:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar documento' });
    }
  }

  /**
   * DELETE /documents/:id — Soft delete
   */
  async softDelete(req: AuthRequest, res: Response) {
    try {
      const document = await Document.findByPk(req.params.id);
      if (!document || !document.isActive) {
        return res.status(404).json({ success: false, message: 'Documento no encontrado' });
      }

      await document.update({ isActive: false });

      createAuditLog({
        userId: req.user?.id || 0,
        action: 'delete',
        entityType: 'document',
        entityId: document.id,
        oldValues: { documentCode: document.documentCode },
      }).catch(() => {});

      logger.info(`Document soft-deleted: ${document.documentCode} by user ${req.user?.id}`);
      return res.json({ success: true, message: 'Documento eliminado' });
    } catch (error) {
      logger.error('Error deleting document:', error);
      return res.status(500).json({ success: false, message: 'Error al eliminar documento' });
    }
  }
}

export default new DocumentController();
