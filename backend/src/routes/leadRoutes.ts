import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { LeadController } from '../controllers/leadController';

// Roles que pueden gestionar prospectos (CRM = ventas)
const ROLES_CRM = ['admin', 'director_general', 'jefe_ventas', 'vendedor'] as const;

const router = Router();

// Todas las rutas de leads requieren autenticacion
router.use(authMiddleware);

// ============================================
// VALIDACIONES
// ============================================

const createLeadValidation = [
  body('name')
    .notEmpty().withMessage('El nombre del prospecto es requerido')
    .isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('company')
    .optional()
    .isLength({ max: 255 }).withMessage('La empresa no puede exceder 255 caracteres'),
  body('email')
    .optional()
    .isEmail().withMessage('El email debe ser valido'),
  body('phone')
    .optional()
    .isLength({ max: 20 }).withMessage('El telefono no puede exceder 20 caracteres'),
  body('source')
    .optional()
    .isIn(['web', 'referral', 'cold_call', 'event', 'social_media', 'other'])
    .withMessage('Fuente de prospecto invalida'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Prioridad invalida'),
  body('estimatedValue')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El valor estimado debe ser un numero valido'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del asignado debe ser un numero valido'),
  body('nextFollowUp')
    .optional()
    .isISO8601().withMessage('La fecha de seguimiento debe ser una fecha valida'),
  body('notes')
    .optional()
    .isLength({ max: 2000 }).withMessage('Las notas no pueden exceder 2000 caracteres'),
];

const updateLeadValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del prospecto debe ser un numero valido'),
  ...createLeadValidation.map(v => v.optional()),
];

const getAllValidation = [
  query('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])
    .withMessage('Estado de prospecto invalido'),
  query('source')
    .optional()
    .isIn(['web', 'referral', 'cold_call', 'event', 'social_media', 'other'])
    .withMessage('Fuente invalida'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Prioridad invalida'),
  query('assigned_to')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del asignado debe ser un numero valido'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El numero de pagina debe ser un numero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El limite debe ser un numero entre 1 y 100'),
];

const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del prospecto debe ser un numero valido'),
];

const changeStatusValidation = [
  ...idValidation,
  body('status')
    .notEmpty().withMessage('El nuevo estado es requerido')
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])
    .withMessage('Estado de prospecto invalido'),
  body('lostReason')
    .optional()
    .isLength({ max: 500 }).withMessage('La razon no puede exceder 500 caracteres'),
];

const addActivityValidation = [
  ...idValidation,
  body('activityType')
    .notEmpty().withMessage('El tipo de actividad es requerido')
    .isIn(['call', 'email', 'meeting', 'note', 'follow_up', 'proposal'])
    .withMessage('Tipo de actividad invalido'),
  body('description')
    .notEmpty().withMessage('La descripcion es requerida')
    .isLength({ max: 2000 }).withMessage('La descripcion no puede exceder 2000 caracteres'),
  body('scheduledAt')
    .optional()
    .isISO8601().withMessage('La fecha programada debe ser una fecha valida'),
];

const activityIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del prospecto debe ser un numero valido'),
  param('activityId')
    .isInt({ min: 1 }).withMessage('El ID de la actividad debe ser un numero valido'),
];

// ============================================
// RUTAS
// ============================================

// GET /api/leads/statistics - Estadisticas (ANTES de /:id para evitar conflicto)
router.get('/statistics',
  requireRole(...ROLES_CRM),
  LeadController.getStatistics
);

// GET /api/leads - Listar prospectos
router.get('/',
  requireRole(...ROLES_CRM),
  getAllValidation,
  LeadController.getAll
);

// GET /api/leads/:id - Obtener prospecto por ID
router.get('/:id',
  requireRole(...ROLES_CRM),
  idValidation,
  LeadController.getById
);

// POST /api/leads - Crear prospecto
router.post('/',
  requireRole(...ROLES_CRM),
  createLeadValidation,
  LeadController.create
);

// PUT /api/leads/:id - Actualizar prospecto
router.put('/:id',
  requireRole(...ROLES_CRM),
  updateLeadValidation,
  LeadController.update
);

// DELETE /api/leads/:id - Eliminar prospecto
router.delete('/:id',
  requireRole(...ROLES_CRM),
  idValidation,
  LeadController.delete
);

// PATCH /api/leads/:id/status - Cambiar status del prospecto
router.patch('/:id/status',
  requireRole(...ROLES_CRM),
  changeStatusValidation,
  LeadController.changeStatus
);

// POST /api/leads/:id/convert - Convertir prospecto a cliente
router.post('/:id/convert',
  requireRole(...ROLES_CRM),
  idValidation,
  LeadController.convertToCustomer
);

// GET /api/leads/:id/activities - Listar actividades
router.get('/:id/activities',
  requireRole(...ROLES_CRM),
  idValidation,
  LeadController.getActivities
);

// POST /api/leads/:id/activities - Agregar actividad
router.post('/:id/activities',
  requireRole(...ROLES_CRM),
  addActivityValidation,
  LeadController.addActivity
);

// PATCH /api/leads/:id/activities/:activityId/complete - Completar actividad
router.patch('/:id/activities/:activityId/complete',
  requireRole(...ROLES_CRM),
  activityIdValidation,
  LeadController.completeActivity
);

export default router;
