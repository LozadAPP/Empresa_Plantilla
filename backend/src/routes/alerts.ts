import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getAlerts,
  getAlertById,
  createAlert,
  markAsRead,
  markAsUnread,
  resolveAlert,
  deleteAlert,
  getAlertStats,
  getAlertTrends,
} from '../controllers/alertController';

const router = Router();

// Apply authentication to all alert routes
router.use(authMiddleware);

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Get all alerts
 *     description: Retrieve all system alerts with optional filters
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: alertType
 *         schema:
 *           type: string
 *           enum: [rental_expiring, rental_overdue, payment_pending, maintenance_due, insurance_expiring, low_inventory, system, custom]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, critical]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isResolved
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Alert'
 *   post:
 *     summary: Create alert
 *     description: Create a new system alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertType
 *               - title
 *               - message
 *             properties:
 *               alertType:
 *                 type: string
 *                 enum: [rental_expiring, rental_overdue, payment_pending, maintenance_due, insurance_expiring, low_inventory, system, custom]
 *               severity:
 *                 type: string
 *                 enum: [info, warning, critical]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 enum: [vehicle, rental, customer, payment, invoice, maintenance, user, other]
 *               entityId:
 *                 type: integer
 *               assignedTo:
 *                 type: integer
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Alert created successfully
 */

/**
 * @swagger
 * /alerts/stats:
 *   get:
 *     summary: Get alert statistics
 *     description: Get statistics about alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert statistics
 */

/**
 * @swagger
 * /alerts/{id}:
 *   get:
 *     summary: Get alert by ID
 *     description: Retrieve a specific alert by its ID
 *     tags: [Alerts]
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
 *         description: Alert details
 *       404:
 *         description: Alert not found
 *   delete:
 *     summary: Delete alert
 *     description: Delete an alert
 *     tags: [Alerts]
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
 *         description: Alert deleted
 */

/**
 * @swagger
 * /alerts/{id}/read:
 *   post:
 *     summary: Mark alert as read
 *     description: Mark an alert as read
 *     tags: [Alerts]
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
 *         description: Alert marked as read
 */

/**
 * @swagger
 * /alerts/{id}/unread:
 *   post:
 *     summary: Mark alert as unread
 *     description: Mark an alert as unread
 *     tags: [Alerts]
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
 *         description: Alert marked as unread
 */

/**
 * @swagger
 * /alerts/{id}/resolve:
 *   post:
 *     summary: Resolve alert
 *     description: Mark an alert as resolved
 *     tags: [Alerts]
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
 *         description: Alert resolved
 */

// ====================================
// ALERT VALIDATIONS
// ====================================

const createAlertValidation = [
  body('alertType')
    .notEmpty().withMessage('El tipo de alerta es requerido')
    .isIn(['rental_expiring', 'rental_overdue', 'payment_pending', 'maintenance_due', 'insurance_expiring', 'low_inventory', 'system', 'custom'])
    .withMessage('Tipo de alerta inválido'),
  body('severity')
    .optional()
    .isIn(['info', 'warning', 'critical'])
    .withMessage('Severidad inválida'),
  body('title')
    .notEmpty().withMessage('El título es requerido')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('El título debe tener entre 2 y 200 caracteres'),
  body('message')
    .notEmpty().withMessage('El mensaje es requerido')
    .isLength({ max: 1000 }).withMessage('El mensaje no puede exceder 1000 caracteres'),
  body('entityType')
    .optional()
    .isIn(['vehicle', 'rental', 'customer', 'payment', 'invoice', 'maintenance', 'user', 'other'])
    .withMessage('Tipo de entidad inválido'),
  body('entityId')
    .optional()
    .isString().withMessage('El ID de entidad debe ser una cadena')
    .isLength({ max: 50 }).withMessage('El ID de entidad no puede exceder 50 caracteres'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del usuario asignado debe ser un número válido'),
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('La fecha de expiración debe ser una fecha válida'),
  body('metadata')
    .optional()
    .isObject().withMessage('Los metadatos deben ser un objeto')
];

const getAlertByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la alerta debe ser un número válido')
];

const markAsReadValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la alerta debe ser un número válido')
];

const markAsUnreadValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la alerta debe ser un número válido')
];

const resolveAlertValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la alerta debe ser un número válido')
];

const deleteAlertValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la alerta debe ser un número válido')
];

const getAllAlertsValidation = [
  query('alertType')
    .optional()
    .isIn(['rental_expiring', 'rental_overdue', 'payment_pending', 'maintenance_due', 'insurance_expiring', 'low_inventory', 'system', 'custom'])
    .withMessage('Tipo de alerta inválido'),
  query('severity')
    .optional()
    .isIn(['info', 'warning', 'critical'])
    .withMessage('Severidad inválida'),
  query('isRead')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de isRead debe ser true o false'),
  query('isResolved')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de isResolved debe ser true o false'),
  query('assignedTo')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del usuario asignado debe ser un número válido'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
];

// GET /api/alerts - Get all alerts
router.get('/', getAllAlertsValidation, getAlerts);

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', getAlertStats);

// GET /api/alerts/trends - Get alert trends for chart
router.get('/trends', getAlertTrends);

// GET /api/alerts/:id - Get alert by ID
router.get('/:id', getAlertByIdValidation, getAlertById);

// POST /api/alerts - Create new alert
router.post('/', createAlertValidation, createAlert);

// POST /api/alerts/:id/read - Mark alert as read
router.post('/:id/read', markAsReadValidation, markAsRead);

// POST /api/alerts/:id/unread - Mark alert as unread
router.post('/:id/unread', markAsUnreadValidation, markAsUnread);

// POST /api/alerts/:id/resolve - Resolve alert
router.post('/:id/resolve', resolveAlertValidation, resolveAlert);

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', deleteAlertValidation, deleteAlert);

export default router;
