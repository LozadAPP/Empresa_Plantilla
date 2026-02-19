import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { RentalController } from '../controllers/rentalController';

// Roles que pueden aprobar/rechazar rentas
const ROLES_APROBACION = ['admin', 'director_general', 'jefe_ventas'] as const;

const router = Router();

// Apply authentication to all rental routes
router.use(authMiddleware);

/**
 * @swagger
 * /rentals:
 *   get:
 *     summary: Get all rentals
 *     description: Retrieve a paginated list of rentals with optional filters
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [reserved, active, completed, cancelled]
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
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
 *         description: List of rentals
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
 *                         $ref: '#/components/schemas/Rental'
 *   post:
 *     summary: Create a new rental
 *     description: Create a new vehicle rental
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - vehicle_id
 *               - location_id
 *               - start_date
 *               - end_date
 *             properties:
 *               customer_id:
 *                 type: integer
 *               vehicle_id:
 *                 type: integer
 *               location_id:
 *                 type: integer
 *               return_location_id:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               daily_rate:
 *                 type: number
 *               tax_percentage:
 *                 type: number
 *               discount_percentage:
 *                 type: number
 *               insurance_amount:
 *                 type: number
 *               extras_amount:
 *                 type: number
 *               deposit_amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, transfer, check, other]
 *               start_mileage:
 *                 type: integer
 *               fuel_level_start:
 *                 type: string
 *                 enum: [empty, quarter, half, three_quarters, full]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rental created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer or vehicle not found
 */

/**
 * @swagger
 * /rentals/{id}:
 *   get:
 *     summary: Get rental by ID
 *     description: Retrieve a specific rental by its ID
 *     tags: [Rentals]
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
 *         description: Rental details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Rental'
 *       404:
 *         description: Rental not found
 *   put:
 *     summary: Update rental
 *     description: Update an existing rental
 *     tags: [Rentals]
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
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               daily_rate:
 *                 type: number
 *               tax_percentage:
 *                 type: number
 *               discount_percentage:
 *                 type: number
 *               insurance_amount:
 *                 type: number
 *               extras_amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [reserved, active, completed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rental updated successfully
 *       404:
 *         description: Rental not found
 *   delete:
 *     summary: Cancel rental
 *     description: Cancel an existing rental
 *     tags: [Rentals]
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
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Rental cancelled successfully
 *       404:
 *         description: Rental not found
 */

// Validation rules
const createRentalValidation = [
  body('customer_id')
    .notEmpty().withMessage('El ID del cliente es requerido')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  body('vehicle_id')
    .notEmpty().withMessage('El ID del vehículo es requerido')
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  body('location_id')
    .notEmpty().withMessage('El ID de la ubicación es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la ubicación debe ser un número válido'),
  body('return_location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la ubicación de devolución debe ser un número válido'),
  body('start_date')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida'),
  body('end_date')
    .notEmpty().withMessage('La fecha de fin es requerida')
    .isISO8601().withMessage('La fecha de fin debe ser una fecha válida'),
  body('daily_rate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa diaria debe ser un número válido'),
  body('tax_percentage')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El porcentaje de impuesto debe ser un número válido'),
  body('discount_percentage')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El porcentaje de descuento debe ser un número válido'),
  body('insurance_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto del seguro debe ser un número válido'),
  body('extras_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto de extras debe ser un número válido'),
  body('deposit_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto del depósito debe ser un número válido'),
  body('shipping_cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El costo de envío debe ser un número válido'),
  body('price_adjustment')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El ajuste de precio debe ser un número válido'),
  body('adjustment_reason')
    .optional()
    .isLength({ max: 500 }).withMessage('La razón del ajuste no puede exceder 500 caracteres'),
  body('payment_method')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'transfer', 'check'])
    .withMessage('Método de pago inválido'),
  body('start_mileage')
    .optional()
    .isInt({ min: 0 }).withMessage('El kilometraje inicial debe ser un número positivo'),
  body('fuel_level_start')
    .optional()
    .isIn(['empty', 'quarter', 'half', 'three_quarters', 'full'])
    .withMessage('Nivel de combustible inválido'),
  body('notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres')
];

const updateRentalValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  body('start_date')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida'),
  body('end_date')
    .optional()
    .isISO8601().withMessage('La fecha de fin debe ser una fecha válida'),
  body('daily_rate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa diaria debe ser un número válido'),
  body('tax_percentage')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El porcentaje de impuesto debe ser un número válido'),
  body('discount_percentage')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El porcentaje de descuento debe ser un número válido'),
  body('insurance_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto del seguro debe ser un número válido'),
  body('extras_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto de extras debe ser un número válido'),
  body('shipping_cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El costo de envío debe ser un número válido'),
  body('price_adjustment')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El ajuste de precio debe ser un número válido'),
  body('adjustment_reason')
    .optional()
    .isLength({ max: 500 }).withMessage('La razón del ajuste no puede exceder 500 caracteres'),
  body('status')
    .optional()
    .isIn(['pending_approval', 'reserved', 'active', 'completed', 'cancelled', 'overdue'])
    .withMessage('Estado de renta inválido'),
  body('notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres')
];

const getByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido')
];

const cancelRentalValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('La razón de cancelación no puede exceder 500 caracteres')
];

const getAllValidation = [
  query('status')
    .optional()
    .isIn(['pending_approval', 'reserved', 'active', 'completed', 'cancelled', 'overdue'])
    .withMessage('Estado de renta inválido'),
  query('customer_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  query('vehicle_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  query('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la ubicación debe ser un número válido'),
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

// GET /api/rentals - Obtener todas las rentas
router.get('/', getAllValidation, RentalController.getAll);

// ============================================
// RUTAS DE APROBACIÓN (deben ir ANTES de /:id)
// ============================================

// GET /api/rentals/pending-approvals - Obtener rentas pendientes de aprobación
router.get(
  '/pending-approvals',
  requireRole(...ROLES_APROBACION),
  RentalController.getPendingApprovals
);

// POST /api/rentals/:id/approve - Aprobar una renta
router.post(
  '/:id/approve',
  requireRole(...ROLES_APROBACION),
  [param('id').isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido')],
  RentalController.approve
);

// POST /api/rentals/:id/reject - Rechazar una renta
router.post(
  '/:id/reject',
  requireRole(...ROLES_APROBACION),
  [
    param('id').isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
    body('reason')
      .notEmpty().withMessage('La razón del rechazo es requerida')
      .isLength({ min: 10, max: 500 }).withMessage('La razón debe tener entre 10 y 500 caracteres')
  ],
  RentalController.reject
);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// GET /api/rentals/:id - Obtener una renta por ID
router.get('/:id', getByIdValidation, RentalController.getById);

// POST /api/rentals - Crear una nueva renta
router.post('/', createRentalValidation, RentalController.create);

// PUT /api/rentals/:id - Actualizar una renta
router.put('/:id', updateRentalValidation, RentalController.update);

// DELETE /api/rentals/:id - Cancelar una renta
router.delete('/:id', cancelRentalValidation, RentalController.cancel);

export default router;
