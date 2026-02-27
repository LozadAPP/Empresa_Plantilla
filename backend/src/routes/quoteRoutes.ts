import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { QuoteController } from '../controllers/quoteController';

// Roles que pueden gestionar cotizaciones
const ROLES_QUOTES = ['admin', 'director_general', 'jefe_ventas', 'vendedor'] as const;

const router = Router();

// Todas las rutas de cotizaciones requieren autenticación
router.use(authMiddleware);

// ============================================
// VALIDACIONES
// ============================================

const createQuoteValidation = [
  body('customer_id')
    .notEmpty().withMessage('El ID del cliente es requerido')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  body('vehicle_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del vehículo debe ser un número válido'),
  body('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la ubicación debe ser un número válido'),
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
  body('deposit_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto del depósito debe ser un número válido'),
  body('valid_days')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Los días de vigencia deben ser entre 1 y 365'),
  body('notes')
    .optional()
    .isLength({ max: 2000 }).withMessage('Las notas no pueden exceder 2000 caracteres')
];

const updateQuoteValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la cotización debe ser un número válido'),
  ...createQuoteValidation.map(v => v.optional())
];

const getAllValidation = [
  query('status')
    .optional()
    .isIn(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'])
    .withMessage('Estado de cotización inválido'),
  query('customer_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  query('vehicle_id')
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

const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la cotización debe ser un número válido')
];

// ============================================
// RUTAS CRUD
// ============================================

// GET /api/quotes - Listar cotizaciones
router.get('/',
  requireRole(...ROLES_QUOTES),
  getAllValidation,
  QuoteController.getAll
);

// GET /api/quotes/:id - Obtener cotización por ID
router.get('/:id',
  requireRole(...ROLES_QUOTES),
  idValidation,
  QuoteController.getById
);

// POST /api/quotes - Crear cotización
router.post('/',
  requireRole(...ROLES_QUOTES),
  createQuoteValidation,
  QuoteController.create
);

// PUT /api/quotes/:id - Actualizar cotización
router.put('/:id',
  requireRole(...ROLES_QUOTES),
  updateQuoteValidation,
  QuoteController.update
);

// DELETE /api/quotes/:id - Eliminar cotización
router.delete('/:id',
  requireRole(...ROLES_QUOTES),
  idValidation,
  QuoteController.delete
);

// ============================================
// RUTAS DE ACCIONES
// ============================================

// PATCH /api/quotes/:id/send - Enviar cotización
router.patch('/:id/send',
  requireRole(...ROLES_QUOTES),
  idValidation,
  QuoteController.send
);

// PATCH /api/quotes/:id/accept - Aceptar cotización
router.patch('/:id/accept',
  requireRole(...ROLES_QUOTES),
  idValidation,
  QuoteController.accept
);

// PATCH /api/quotes/:id/reject - Rechazar cotización
router.patch('/:id/reject',
  requireRole(...ROLES_QUOTES),
  [
    ...idValidation,
    body('reason')
      .optional()
      .isLength({ max: 500 }).withMessage('La razón no puede exceder 500 caracteres')
  ],
  QuoteController.reject
);

// POST /api/quotes/:id/convert - Convertir a renta
router.post('/:id/convert',
  requireRole(...ROLES_QUOTES),
  idValidation,
  QuoteController.convertToRental
);

// GET /api/quotes/:id/pdf - Descargar PDF de cotización
router.get('/:id/pdf',
  requireRole(...ROLES_QUOTES),
  idValidation,
  QuoteController.downloadPDF
);

export default router;
