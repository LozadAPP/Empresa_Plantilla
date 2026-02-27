import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseSummary,
  getExpenseCategories,
} from '../controllers/expenseController';

const ROLES_VIEW = ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'contador', 'cajero'] as const;
const ROLES_CREATE = ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'contador'] as const;
const ROLES_APPROVE = ['admin', 'director_general', 'jefe_finanzas'] as const;

const router = Router();

router.use(authMiddleware);

// ============================================
// VALIDACIONES
// ============================================

const createValidation = [
  body('category')
    .notEmpty().withMessage('La categoría es requerida')
    .isIn(['operacion', 'vehiculos', 'financieros', 'otros']).withMessage('Categoría inválida'),
  body('description')
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 3, max: 500 }).withMessage('La descripción debe tener entre 3 y 500 caracteres'),
  body('amount')
    .notEmpty().withMessage('El monto es requerido')
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('tax_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('El IVA debe ser un número válido'),
  body('expense_date')
    .notEmpty().withMessage('La fecha del gasto es requerida')
    .isISO8601().withMessage('La fecha debe ser válida'),
  body('payment_method')
    .optional()
    .isIn(['cash', 'card', 'transfer', 'check', 'other']).withMessage('Método de pago inválido'),
  body('subcategory').optional().isString(),
  body('account_id').optional().isInt({ min: 1 }),
  body('supplier_id').optional().isInt({ min: 1 }),
  body('supplier_name').optional().isString().isLength({ max: 255 }),
  body('supplier_rfc').optional().isString().isLength({ max: 20 }),
  body('receipt_number').optional().isString().isLength({ max: 100 }),
  body('due_date').optional().isISO8601(),
  body('is_recurring').optional().isBoolean(),
  body('recurrence_period').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('location_id').optional().isInt({ min: 1 }),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt({ min: 1 }),
  body('notes').optional().isString(),
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
];

const rejectValidation = [
  ...idValidation,
  body('rejection_reason')
    .notEmpty().withMessage('La razón del rechazo es requerida')
    .isLength({ min: 3, max: 500 }).withMessage('La razón debe tener entre 3 y 500 caracteres'),
];

// ============================================
// RUTAS
// ============================================

// Summary & categories (before /:id to avoid conflicts)
router.get('/summary', requireRole(...ROLES_VIEW), getExpenseSummary);
router.get('/categories', requireRole(...ROLES_VIEW), getExpenseCategories);

// CRUD
router.post('/', requireRole(...ROLES_CREATE), createValidation, createExpense);
router.get('/', requireRole(...ROLES_VIEW), getExpenses);
router.get('/:id', requireRole(...ROLES_VIEW), idValidation, getExpenseById);
router.put('/:id', requireRole(...ROLES_CREATE), [...idValidation, ...createValidation], updateExpense);
router.delete('/:id', requireRole(...ROLES_APPROVE), idValidation, deleteExpense);

// Workflow
router.patch('/:id/approve', requireRole(...ROLES_APPROVE), idValidation, approveExpense);
router.patch('/:id/reject', requireRole(...ROLES_APPROVE), rejectValidation, rejectExpense);

export default router;
