import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ReturnController } from '../controllers/returnController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

/**
 * @swagger
 * /returns:
 *   get:
 *     summary: Get all returns
 *     description: Retrieve a paginated list of vehicle returns with optional filters
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rental_id
 *         schema:
 *           type: integer
 *         description: Filter by rental ID
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: integer
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: location_id
 *         schema:
 *           type: integer
 *         description: Filter by location ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of returns
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Return'
 *   post:
 *     summary: Register a vehicle return
 *     description: Register a vehicle return for a rental
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rental_id
 *               - end_mileage
 *               - fuel_level
 *               - vehicle_condition
 *             properties:
 *               rental_id:
 *                 type: integer
 *               return_date:
 *                 type: string
 *                 format: date-time
 *               return_location_id:
 *                 type: integer
 *               end_mileage:
 *                 type: integer
 *                 minimum: 0
 *               fuel_level:
 *                 type: string
 *                 enum: [empty, quarter, half, three_quarters, full]
 *               vehicle_condition:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *               damage_description:
 *                 type: string
 *               damage_cost:
 *                 type: number
 *                 format: decimal
 *               cleaning_required:
 *                 type: boolean
 *               inspection_notes:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Return registered successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Rental not found
 */

/**
 * @swagger
 * /returns/{id}:
 *   get:
 *     summary: Get return by ID
 *     description: Retrieve a specific return by its ID
 *     tags: [Returns]
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
 *         description: Return details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Return'
 *       404:
 *         description: Return not found
 *   put:
 *     summary: Update a return
 *     description: Update return details after vehicle inspection
 *     tags: [Returns]
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
 *               vehicle_condition:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *               damage_description:
 *                 type: string
 *               damage_cost:
 *                 type: number
 *               cleaning_required:
 *                 type: boolean
 *               inspection_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return updated successfully
 *       404:
 *         description: Return not found
 */

/**
 * @swagger
 * /returns/rental/{rentalId}:
 *   get:
 *     summary: Get return by rental ID
 *     description: Retrieve the return associated with a specific rental
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Return details
 *       404:
 *         description: Return not found for this rental
 */

// Validation rules
const createReturnValidation = [
  body('rental_id')
    .notEmpty().withMessage('El ID de la renta es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  body('return_date')
    .optional()
    .isISO8601().withMessage('La fecha de devolución debe ser una fecha válida'),
  body('return_location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la ubicación de devolución debe ser un número válido'),
  body('end_mileage')
    .notEmpty().withMessage('El kilometraje final es requerido')
    .isInt({ min: 0 }).withMessage('El kilometraje final debe ser un número positivo'),
  body('fuel_level')
    .notEmpty().withMessage('El nivel de combustible es requerido')
    .isIn(['empty', 'quarter', 'half', 'three_quarters', 'full'])
    .withMessage('Nivel de combustible inválido'),
  body('vehicle_condition')
    .notEmpty().withMessage('La condición del vehículo es requerida')
    .isIn(['excellent', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Condición del vehículo inválida'),
  body('damage_description')
    .optional()
    .isLength({ max: 1000 }).withMessage('La descripción de daños no puede exceder 1000 caracteres'),
  body('damage_cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El costo de daños debe ser un número válido'),
  body('cleaning_required')
    .optional()
    .isBoolean().withMessage('El campo limpieza requerida debe ser booleano'),
  body('inspection_notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las notas de inspección no pueden exceder 1000 caracteres'),
  body('photos')
    .optional()
    .isArray().withMessage('Las fotos deben ser un arreglo')
];

const updateReturnValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la devolución debe ser un número válido'),
  body('vehicle_condition')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Condición del vehículo inválida'),
  body('damage_description')
    .optional()
    .isLength({ max: 1000 }).withMessage('La descripción de daños no puede exceder 1000 caracteres'),
  body('damage_cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El costo de daños debe ser un número válido'),
  body('cleaning_required')
    .optional()
    .isBoolean().withMessage('El campo limpieza requerida debe ser booleano'),
  body('inspection_notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las notas de inspección no pueden exceder 1000 caracteres')
];

const getByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la devolución debe ser un número válido')
];

const getByRentalIdValidation = [
  param('rentalId')
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido')
];

const getAllValidation = [
  query('rental_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  query('vehicle_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  query('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la ubicación debe ser un número válido'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
];

// Aplicar authMiddleware a TODAS las rutas de este módulo
router.use(authMiddleware);

// Roles que pueden acceder a devoluciones
const returnReadRoles = ['admin', 'director_general', 'jefe_ventas', 'jefe_inventarios', 'vendedor', 'encargado_inventario'] as const;
const returnWriteRoles = ['admin', 'director_general', 'jefe_ventas', 'jefe_inventarios', 'vendedor', 'encargado_inventario'] as const;

// GET /api/returns - Obtener todas las devoluciones
router.get('/', requireRole(...returnReadRoles), getAllValidation, ReturnController.getAll);

// GET /api/returns/rental/:rentalId - Obtener devolución por rental_id
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar que "rental" sea capturado como :id
router.get('/rental/:rentalId', requireRole(...returnReadRoles), getByRentalIdValidation, ReturnController.getByRentalId);

// GET /api/returns/:id - Obtener una devolución por ID
router.get('/:id', requireRole(...returnReadRoles), getByIdValidation, ReturnController.getById);

// POST /api/returns - Registrar una devolución
router.post('/', requireRole(...returnWriteRoles), createReturnValidation, ReturnController.create);

// PUT /api/returns/:id - Actualizar una devolución
router.put('/:id', requireRole(...returnWriteRoles), updateReturnValidation, ReturnController.update);

export default router;
