import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  getMaintenanceTypes,
  createMaintenanceType,
  updateMaintenanceType,
  getMaintenanceOrders,
  getMaintenanceOrderById,
  createMaintenanceOrder,
  updateMaintenanceOrder,
  completeMaintenanceOrder,
  getMaintenanceHistory,
} from '../controllers/maintenanceController';

const router = Router();

// Apply authentication to all maintenance routes
router.use(authMiddleware);

/**
 * @swagger
 * /maintenance/types:
 *   get:
 *     summary: Get maintenance types
 *     description: Retrieve all maintenance types
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of maintenance types
 *   post:
 *     summary: Create maintenance type
 *     description: Create a new maintenance type
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               estimatedDuration:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Maintenance type created
 */

/**
 * @swagger
 * /maintenance/types/{id}:
 *   put:
 *     summary: Update maintenance type
 *     description: Update an existing maintenance type
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               estimatedDuration:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Maintenance type updated
 */

/**
 * @swagger
 * /maintenance/orders:
 *   get:
 *     summary: Get maintenance orders
 *     description: Retrieve maintenance orders with optional filters
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: List of maintenance orders
 *   post:
 *     summary: Create maintenance order
 *     description: Schedule a new maintenance order
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - maintenanceTypeId
 *               - scheduledDate
 *             properties:
 *               vehicleId:
 *                 type: integer
 *               maintenanceTypeId:
 *                 type: integer
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               description:
 *                 type: string
 *               workshopName:
 *                 type: string
 *               technicianName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Maintenance order created
 */

/**
 * @swagger
 * /maintenance/orders/{id}:
 *   get:
 *     summary: Get maintenance order by ID
 *     description: Retrieve a specific maintenance order
 *     tags: [Maintenance]
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
 *         description: Maintenance order details
 *       404:
 *         description: Order not found
 *   put:
 *     summary: Update maintenance order
 *     description: Update an existing maintenance order
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, completed, cancelled]
 *               description:
 *                 type: string
 *               workshopName:
 *                 type: string
 *               technicianName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 */

/**
 * @swagger
 * /maintenance/orders/{id}/complete:
 *   post:
 *     summary: Complete maintenance order
 *     description: Mark a maintenance order as completed
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualCost:
 *                 type: number
 *               actualDuration:
 *                 type: integer
 *               notes:
 *                 type: string
 *               partsReplaced:
 *                 type: array
 *                 items:
 *                   type: string
 *               mileageAtService:
 *                 type: integer
 *               nextServiceMileage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order completed successfully
 */

/**
 * @swagger
 * /maintenance/history/{vehicleId}:
 *   get:
 *     summary: Get vehicle maintenance history
 *     description: Get maintenance history for a specific vehicle
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Maintenance history for the vehicle
 */

// ====================================
// MAINTENANCE TYPES VALIDATIONS
// ====================================

const createMaintenanceTypeValidation = [
  body('name')
    .notEmpty().withMessage('El nombre del tipo de mantenimiento es requerido')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('estimatedCost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El costo estimado debe ser un número válido'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('La duración estimada debe ser un número positivo')
];

const updateMaintenanceTypeValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del tipo de mantenimiento debe ser un número válido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('estimatedCost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El costo estimado debe ser un número válido'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('La duración estimada debe ser un número positivo'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('El valor de isActive debe ser booleano')
];

const getAllTypesValidation = [
  query('isActive')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de isActive debe ser true o false')
];

// ====================================
// MAINTENANCE ORDERS VALIDATIONS
// ====================================

const createMaintenanceOrderValidation = [
  body('vehicleId')
    .notEmpty().withMessage('El ID del vehículo es requerido')
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  body('maintenanceTypeId')
    .notEmpty().withMessage('El ID del tipo de mantenimiento es requerido')
    .isInt({ min: 1 }).withMessage('El ID del tipo de mantenimiento debe ser un número válido'),
  body('scheduledDate')
    .notEmpty().withMessage('La fecha programada es requerida')
    .isISO8601().withMessage('La fecha programada debe ser una fecha válida'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Prioridad inválida'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  body('workshopName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre del taller no puede exceder 100 caracteres'),
  body('technicianName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre del técnico no puede exceder 100 caracteres')
];

const updateMaintenanceOrderValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la orden debe ser un número válido'),
  body('scheduledDate')
    .optional()
    .isISO8601().withMessage('La fecha programada debe ser una fecha válida'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Prioridad inválida'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Estado inválido'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  body('workshopName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre del taller no puede exceder 100 caracteres'),
  body('technicianName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre del técnico no puede exceder 100 caracteres')
];

const getMaintenanceOrderByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la orden debe ser un número válido')
];

const completeMaintenanceOrderValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la orden debe ser un número válido'),
  body('actualCost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El costo real debe ser un número válido'),
  body('actualDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('La duración real debe ser un número positivo'),
  body('notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres'),
  body('partsReplaced')
    .optional()
    .isArray().withMessage('Las partes reemplazadas deben ser un arreglo'),
  body('mileageAtService')
    .optional()
    .isInt({ min: 0 }).withMessage('El kilometraje debe ser un número positivo'),
  body('nextServiceMileage')
    .optional()
    .isInt({ min: 0 }).withMessage('El próximo kilometraje de servicio debe ser un número positivo')
];

const getMaintenanceHistoryValidation = [
  param('vehicleId')
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido')
];

const getAllOrdersValidation = [
  query('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Estado inválido'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Prioridad inválida'),
  query('vehicleId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('La fecha de fin debe ser una fecha válida'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
];

// Roles allowed to manage maintenance
const maintenanceReadRoles = ['admin', 'director_general', 'jefe_inventarios', 'jefe_admin', 'tecnico', 'encargado_inventario'];
const maintenanceWriteRoles = ['admin', 'director_general', 'jefe_inventarios', 'jefe_admin', 'tecnico'];
const maintenanceAdminRoles = ['admin', 'director_general', 'jefe_inventarios', 'jefe_admin'];

// ====================================
// MAINTENANCE TYPES ROUTES
// ====================================

// GET /api/maintenance/types - Get all maintenance types
router.get('/types', requireRole(...maintenanceReadRoles), getAllTypesValidation, getMaintenanceTypes);

// POST /api/maintenance/types - Create new maintenance type (admin only)
router.post('/types', requireRole(...maintenanceAdminRoles), createMaintenanceTypeValidation, createMaintenanceType);

// PUT /api/maintenance/types/:id - Update maintenance type (admin only)
router.put('/types/:id', requireRole(...maintenanceAdminRoles), updateMaintenanceTypeValidation, updateMaintenanceType);

// ====================================
// MAINTENANCE ORDERS ROUTES
// ====================================

// GET /api/maintenance/orders - Get all maintenance orders
router.get('/orders', requireRole(...maintenanceReadRoles), getAllOrdersValidation, getMaintenanceOrders);

// GET /api/maintenance/orders/:id - Get maintenance order by ID
router.get('/orders/:id', requireRole(...maintenanceReadRoles), getMaintenanceOrderByIdValidation, getMaintenanceOrderById);

// POST /api/maintenance/orders - Create new maintenance order
router.post('/orders', requireRole(...maintenanceWriteRoles), createMaintenanceOrderValidation, createMaintenanceOrder);

// PUT /api/maintenance/orders/:id - Update maintenance order
router.put('/orders/:id', requireRole(...maintenanceWriteRoles), updateMaintenanceOrderValidation, updateMaintenanceOrder);

// POST /api/maintenance/orders/:id/complete - Mark order as completed
router.post('/orders/:id/complete', requireRole(...maintenanceWriteRoles), completeMaintenanceOrderValidation, completeMaintenanceOrder);

// GET /api/maintenance/history/:vehicleId - Get maintenance history for a vehicle
router.get('/history/:vehicleId', requireRole(...maintenanceReadRoles), getMaintenanceHistoryValidation, getMaintenanceHistory);

export default router;
