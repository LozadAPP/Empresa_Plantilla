import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  getExtraServices,
  getAllExtraServices,
  getExtraServiceById,
  createExtraService,
  updateExtraService,
  toggleExtraServiceStatus,
  deleteExtraService,
  getServicesByCategory,
} from '../controllers/extraServiceController';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /extra-services:
 *   get:
 *     summary: Get active extra services
 *     description: Retrieve all active extra services (for rental form)
 *     tags: [Extra Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [accessory, insurance, service]
 *       - in: query
 *         name: vehicle_type_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of active extra services
 */

/**
 * @swagger
 * /extra-services/all:
 *   get:
 *     summary: Get all extra services (admin)
 *     description: Retrieve all extra services including inactive
 *     tags: [Extra Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all extra services
 */

/**
 * @swagger
 * /extra-services/by-category:
 *   get:
 *     summary: Get services grouped by category
 *     description: Get active services grouped by category
 *     tags: [Extra Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Services grouped by category
 */

/**
 * @swagger
 * /extra-services/{id}:
 *   get:
 *     summary: Get extra service by ID
 *     description: Retrieve a specific extra service
 *     tags: [Extra Services]
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
 *         description: Extra service data
 *       404:
 *         description: Service not found
 *   put:
 *     summary: Update extra service
 *     description: Update an existing extra service
 *     tags: [Extra Services]
 *     security:
 *       - bearerAuth: []
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
 *               price:
 *                 type: number
 *               price_type:
 *                 type: string
 *                 enum: [per_day, fixed]
 *               category:
 *                 type: string
 *                 enum: [accessory, insurance, service]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Service updated successfully
 *   delete:
 *     summary: Delete extra service
 *     description: Delete or deactivate an extra service
 *     tags: [Extra Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service deleted/deactivated
 */

// ====================================
// VALIDATIONS
// ====================================

const getServicesValidation = [
  query('category')
    .optional()
    .isIn(['accessory', 'insurance', 'service'])
    .withMessage('Categoría inválida'),
  query('vehicle_type_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido'),
  query('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
];

const getAllServicesValidation = [
  query('category')
    .optional()
    .isIn(['accessory', 'insurance', 'service'])
    .withMessage('Categoría inválida'),
  query('vehicle_type_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido'),
  query('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  query('is_active')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de is_active debe ser true o false'),
];

const getServiceByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del servicio debe ser un número válido'),
];

const createServiceValidation = [
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('price')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('price_type')
    .notEmpty().withMessage('El tipo de precio es requerido')
    .isIn(['per_day', 'fixed']).withMessage('Tipo de precio inválido'),
  body('category')
    .notEmpty().withMessage('La categoría es requerida')
    .isIn(['accessory', 'insurance', 'service']).withMessage('Categoría inválida'),
  body('vehicle_type_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido'),
  body('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
];

const updateServiceValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del servicio debe ser un número válido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('price_type')
    .optional()
    .isIn(['per_day', 'fixed']).withMessage('Tipo de precio inválido'),
  body('category')
    .optional()
    .isIn(['accessory', 'insurance', 'service']).withMessage('Categoría inválida'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('El valor de is_active debe ser booleano'),
  body('vehicle_type_id')
    .optional(),
  body('location_id')
    .optional(),
];

const toggleStatusValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del servicio debe ser un número válido'),
];

// ====================================
// ADMIN ROUTES (Static routes first to avoid /:id capturing them)
// ====================================

// Roles that can manage extra services
const adminRoles = requireRole('admin', 'director_general', 'jefe_admin', 'jefe_finanzas');

// GET /api/extra-services/all - Get all services including inactive (admin)
// IMPORTANT: Must be before /:id to avoid "all" being treated as an ID
router.get('/all', adminRoles, getAllServicesValidation, getAllExtraServices);

// ====================================
// PUBLIC ROUTES (All authenticated users)
// ====================================

// GET /api/extra-services - Get active services (for rental form)
router.get('/', getServicesValidation, getExtraServices);

// GET /api/extra-services/by-category - Get services grouped by category
router.get('/by-category', getServicesByCategory);

// GET /api/extra-services/:id - Get single service (MUST be last among GETs)
router.get('/:id', getServiceByIdValidation, getExtraServiceById);

// POST /api/extra-services - Create new service
router.post('/', adminRoles, createServiceValidation, createExtraService);

// PUT /api/extra-services/:id - Update service
router.put('/:id', adminRoles, updateServiceValidation, updateExtraService);

// PATCH /api/extra-services/:id/toggle - Toggle active status
router.patch('/:id/toggle', adminRoles, toggleStatusValidation, toggleExtraServiceStatus);

// DELETE /api/extra-services/:id - Delete service
router.delete('/:id', adminRoles, getServiceByIdValidation, deleteExtraService);

export default router;
