import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  toggleSupplierActive,
  getSupplierDropdown,
  getSupplierStats,
} from '../controllers/supplierController';

const ROLES_VIEW = ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'jefe_inventarios', 'contador', 'cajero'] as const;
const ROLES_CREATE = ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'jefe_inventarios'] as const;
const ROLES_MANAGE = ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin'] as const;

const router = Router();

router.use(authMiddleware);

// ============================================
// VALIDACIONES
// ============================================

const createValidation = [
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('rfc').optional().isString().isLength({ max: 20 }),
  body('supplier_type')
    .optional()
    .isIn(['services', 'products', 'both']).withMessage('Tipo de proveedor inválido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().isString().isLength({ max: 20 }),
  body('contact_person').optional().isString().isLength({ max: 255 }),
  body('address').optional().isString(),
  body('city').optional().isString().isLength({ max: 100 }),
  body('state').optional().isString().isLength({ max: 100 }),
  body('country').optional().isString().isLength({ max: 100 }),
  body('zip_code').optional().isString().isLength({ max: 10 }),
  body('category').optional().isString().isLength({ max: 100 }),
  body('bank_name').optional().isString().isLength({ max: 255 }),
  body('bank_account').optional().isString().isLength({ max: 50 }),
  body('clabe').optional().isString().isLength({ max: 18 }),
  body('payment_terms').optional().isInt({ min: 0 }),
  body('credit_limit').optional().isFloat({ min: 0 }),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('notes').optional().isString(),
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
];

// ============================================
// RUTAS
// ============================================

// Static routes first (before /:id)
router.get('/dropdown', requireRole(...ROLES_VIEW), getSupplierDropdown);
router.get('/stats', requireRole(...ROLES_VIEW), getSupplierStats);

// CRUD
router.post('/', requireRole(...ROLES_CREATE), createValidation, createSupplier);
router.get('/', requireRole(...ROLES_VIEW), getSuppliers);
router.get('/:id', requireRole(...ROLES_VIEW), idValidation, getSupplierById);
router.put('/:id', requireRole(...ROLES_CREATE), [...idValidation, ...createValidation], updateSupplier);
router.delete('/:id', requireRole(...ROLES_MANAGE), idValidation, deleteSupplier);

// Toggle active
router.patch('/:id/toggle', requireRole(...ROLES_MANAGE), idValidation, toggleSupplierActive);

export default router;
