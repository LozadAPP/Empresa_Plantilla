import { Router } from 'express';
import { param, query, body } from 'express-validator';
import documentController from '../controllers/documentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { uploadSingle, handleUploadError } from '../middleware/uploadMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ── GET routes (all authenticated users) ────────────

// Statistics MUST be before /:id to avoid capture
router.get('/statistics', documentController.getStatistics);

// By entity MUST be before /:id
router.get(
  '/entity/:entityType/:entityId',
  param('entityType').notEmpty().withMessage('Tipo de entidad requerido'),
  param('entityId').isInt({ min: 1 }).withMessage('ID de entidad inválido'),
  documentController.getByEntity
);

// List with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
    query('document_type').optional().isIn(['contract', 'invoice', 'quote', 'ficha', 'movement', 'upload']).withMessage('Tipo de documento inválido'),
    query('category').optional().isIn(['legal', 'financial', 'operational', 'technical', 'general']).withMessage('Categoría inválida'),
    query('source').optional().isIn(['auto', 'upload']).withMessage('Origen inválido'),
    query('entity_type').optional().isString(),
    query('entity_id').optional().isInt({ min: 1 }),
  ],
  documentController.getAll
);

// Single document
router.get(
  '/:id',
  param('id').isInt({ min: 1 }).withMessage('ID de documento inválido'),
  documentController.getById
);

// Download file
router.get(
  '/:id/download',
  param('id').isInt({ min: 1 }).withMessage('ID de documento inválido'),
  documentController.download
);

// ── POST routes (management roles) ──────────────────

router.post(
  '/upload',
  requireRole('admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'encargado_inventario', 'vendedor', 'contador'),
  uploadSingle,
  handleUploadError,
  documentController.upload
);

// ── PUT routes (admin roles) ────────────────────────

router.put(
  '/:id',
  requireRole('admin', 'director_general', 'jefe_admin'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de documento inválido'),
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('category').optional().isIn(['legal', 'financial', 'operational', 'technical', 'general']).withMessage('Categoría inválida'),
  ],
  documentController.update
);

// ── DELETE routes (admin roles) ─────────────────────

router.delete(
  '/:id',
  requireRole('admin', 'director_general', 'jefe_admin'),
  param('id').isInt({ min: 1 }).withMessage('ID de documento inválido'),
  documentController.softDelete
);

export default router;
