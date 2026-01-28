import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getAuditLogsByUser,
  getEntityTypes
} from '../controllers/auditLogController';

const router = Router();

// Apply authentication to all audit routes
router.use(authMiddleware);

// Only admin and director can access audit logs
router.use(requireRole('admin', 'director'));

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Get all audit logs
 *     description: Retrieve all audit logs with filters and pagination
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of audit logs
 */

/**
 * @swagger
 * /audit/stats:
 *   get:
 *     summary: Get audit statistics
 *     description: Get statistics about audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics
 */

/**
 * @swagger
 * /audit/entity-types:
 *   get:
 *     summary: Get entity types
 *     description: Get all entity types for filter dropdowns
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of entity types
 */

/**
 * @swagger
 * /audit/user/{userId}:
 *   get:
 *     summary: Get audit logs by user
 *     description: Get audit logs for a specific user
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit logs for the user
 */

/**
 * @swagger
 * /audit/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     description: Retrieve a specific audit log by its ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit log details
 *       404:
 *         description: Audit log not found
 */

// ====================================
// AUDIT LOG ROUTES
// ====================================

// GET /api/audit - Get all audit logs with filters and pagination
router.get('/', getAuditLogs);

// GET /api/audit/stats - Get audit statistics
router.get('/stats', getAuditStats);

// GET /api/audit/entity-types - Get all entity types (for filters)
router.get('/entity-types', getEntityTypes);

// GET /api/audit/user/:userId - Get audit logs by user
router.get('/user/:userId', getAuditLogsByUser);

// GET /api/audit/:id - Get audit log by ID
router.get('/:id', getAuditLogById);

export default router;
