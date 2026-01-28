import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { Op } from 'sequelize';
import vehicleController from '../controllers/vehicleController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { isValidVIN } from '../utils/vinValidator';
import Vehicle from '../models/Vehicle';

const router = Router();

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles
 *     description: Retrieve a list of all vehicles with optional filters
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, rented, maintenance, out_of_service, reserved]
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
 *         description: List of vehicles
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
 *                     $ref: '#/components/schemas/Vehicle'
 *   post:
 *     summary: Create a new vehicle
 *     description: Add a new vehicle to the inventory
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - license_plate
 *               - vin
 *               - year
 *               - vehicle_type_id
 *               - location_id
 *               - purchase_price
 *               - current_value
 *               - monthly_depreciation
 *             properties:
 *               make:
 *                 type: string
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 example: Camry
 *               license_plate:
 *                 type: string
 *                 example: ABC-123
 *               vin:
 *                 type: string
 *                 minLength: 17
 *                 maxLength: 17
 *               year:
 *                 type: integer
 *               vehicle_type_id:
 *                 type: integer
 *               location_id:
 *                 type: integer
 *               purchase_price:
 *                 type: number
 *               current_value:
 *                 type: number
 *               monthly_depreciation:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /vehicles/available:
 *   get:
 *     summary: Get available vehicles
 *     description: Retrieve a list of vehicles that are available for rent
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available vehicles
 */

/**
 * @swagger
 * /vehicles/statistics:
 *   get:
 *     summary: Get vehicle statistics
 *     description: Get statistics about the vehicle fleet
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle statistics
 */

/**
 * @swagger
 * /vehicles/by-type:
 *   get:
 *     summary: Get vehicles grouped by type
 *     description: Get vehicles organized by their type
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicles grouped by type
 */

/**
 * @swagger
 * /vehicles/types:
 *   get:
 *     summary: Get vehicle types
 *     description: Get list of all vehicle types
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vehicle types
 */

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     description: Retrieve a specific vehicle by its ID
 *     tags: [Vehicles]
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
 *         description: Vehicle details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
 *   put:
 *     summary: Update vehicle
 *     description: Update an existing vehicle
 *     tags: [Vehicles]
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
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               current_value:
 *                 type: number
 *               mileage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       404:
 *         description: Vehicle not found
 *   delete:
 *     summary: Delete vehicle
 *     description: Delete a vehicle from the inventory
 *     tags: [Vehicles]
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
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
 */

/**
 * @swagger
 * /vehicles/{id}/status:
 *   patch:
 *     summary: Update vehicle status
 *     description: Update the status of a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, rented, maintenance, out_of_service, reserved]
 *     responses:
 *       200:
 *         description: Vehicle status updated
 *       404:
 *         description: Vehicle not found
 */

// Custom validators
/**
 * Valida que el VIN sea único durante actualización (excluye el vehículo actual)
 */
const isVINUniqueOnUpdate = async (value: string, { req }: any) => {
  if (!value) {
    // Si el VIN no se está actualizando, no validar
    return true;
  }

  const vehicleId = parseInt(req.params.id);
  const existing = await Vehicle.findOne({
    where: {
      vin: value.toUpperCase(),
      id: { [Op.ne]: vehicleId }
    }
  });

  if (existing) {
    throw new Error('VIN ya existe en otro vehículo');
  }
  return true;
};

// Validation rules
const createVehicleValidation = [
  body('make').trim().notEmpty().withMessage('Make is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('license_plate').trim().notEmpty().withMessage('License plate is required'),
  body('vin')
    .trim()
    .custom(isValidVIN),
  body('year')
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be between 1990 and next year'),
  body('vehicle_type_id').isInt().withMessage('Vehicle type is required'),
  body('location_id').isInt().withMessage('Location is required'),
  body('purchase_price')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be positive'),
  body('current_value')
    .isFloat({ min: 0 })
    .withMessage('Current value must be positive'),
  body('monthly_depreciation')
    .isFloat({ min: 0 })
    .withMessage('Monthly depreciation must be positive')
];

const updateVehicleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  body('vin')
    .optional()
    .trim()
    .custom(isValidVIN)
    .custom(isVINUniqueOnUpdate),
  body('make').optional().trim().notEmpty().withMessage('Make cannot be empty'),
  body('model').optional().trim().notEmpty().withMessage('Model cannot be empty'),
  body('year')
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be between 1990 and next year'),
  body('current_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current value must be positive'),
  body('mileage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mileage must be positive')
];

const getVehicleByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido')
];

const updateStatusValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  body('status')
    .notEmpty().withMessage('El estado es requerido')
    .isIn(['available', 'rented', 'maintenance', 'out_of_service', 'reserved'])
    .withMessage('Estado de vehículo inválido')
];

const deleteVehicleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido')
];

const getAllVehiclesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100'),
  query('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance', 'out_of_service', 'reserved'])
    .withMessage('Estado de vehículo inválido'),
  query('vehicle_type_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido'),
  query('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido')
];

const getByTypeValidation = [
  query('type_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido')
];

// All routes require authentication
router.use(authMiddleware);

// GET routes - accessible by most roles
router.get('/', getAllVehiclesValidation, vehicleController.getAll);
router.get('/available', vehicleController.getAvailable);
router.get('/statistics', vehicleController.getStatistics);
router.get('/by-type', getByTypeValidation, vehicleController.getByType);
router.get('/types', vehicleController.getVehicleTypes);
router.get('/:id', getVehicleByIdValidation, vehicleController.getById);

// POST/PUT/DELETE routes - require specific roles
// POST - Create vehicle (inventory team + admin)
router.post(
  '/',
  requireRole('admin', 'director_general', 'jefe_inventarios', 'encargado_inventario'),
  createVehicleValidation,
  vehicleController.create
);

// PUT - Update vehicle (inventory team + admin)
router.put(
  '/:id',
  requireRole('admin', 'director_general', 'jefe_inventarios', 'encargado_inventario'),
  updateVehicleValidation,
  vehicleController.update
);

// PATCH - Update status (inventory team + sales team can change status)
router.patch(
  '/:id/status',
  requireRole('admin', 'director_general', 'jefe_inventarios', 'encargado_inventario', 'jefe_ventas', 'vendedor'),
  updateStatusValidation,
  vehicleController.updateStatus
);

// DELETE - Delete vehicle (top management only)
router.delete(
  '/:id',
  requireRole('admin', 'director_general', 'jefe_admin'),
  deleteVehicleValidation,
  vehicleController.delete
);

export default router;
