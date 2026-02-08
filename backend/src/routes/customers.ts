import { Router } from 'express';
import { body, param, query } from 'express-validator';
import customerController from '../controllers/customerController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a list of all customers with optional filters
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: customer_type
 *         schema:
 *           type: string
 *           enum: [individual, corporate, government]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of customers
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
 *                     $ref: '#/components/schemas/Customer'
 *   post:
 *     summary: Create a new customer
 *     description: Create a new customer (requires admin/manager/seller role)
 *     tags: [Customers]
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
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               customer_type:
 *                 type: string
 *                 enum: [individual, corporate, government]
 *               credit_limit:
 *                 type: number
 *               payment_terms:
 *                 type: integer
 *               discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /customers/active:
 *   get:
 *     summary: Get active customers
 *     description: Retrieve a list of all active customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active customers
 */

/**
 * @swagger
 * /customers/search:
 *   get:
 *     summary: Search customers
 *     description: Search customers by name, email, or phone
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */

/**
 * @swagger
 * /customers/statistics:
 *   get:
 *     summary: Get customer statistics
 *     description: Get statistics about customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics
 */

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve a specific customer by their ID
 *     tags: [Customers]
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
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *   put:
 *     summary: Update customer
 *     description: Update an existing customer
 *     tags: [Customers]
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
 *               email:
 *                 type: string
 *                 format: email
 *               customer_type:
 *                 type: string
 *                 enum: [individual, corporate, government]
 *               credit_limit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *   delete:
 *     summary: Delete customer
 *     description: Delete a customer (admin/manager only)
 *     tags: [Customers]
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
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */

/**
 * @swagger
 * /customers/{id}/rentals:
 *   get:
 *     summary: Get customer rentals
 *     description: Get all rentals for a specific customer
 *     tags: [Customers]
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
 *         description: List of customer rentals
 */

/**
 * @swagger
 * /customers/{id}/toggle-active:
 *   patch:
 *     summary: Toggle customer active status
 *     description: Activate or deactivate a customer
 *     tags: [Customers]
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
 *         description: Customer status toggled
 */

/**
 * @swagger
 * /customers/{id}/credit-limit:
 *   patch:
 *     summary: Update credit limit
 *     description: Update a customer's credit limit
 *     tags: [Customers]
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
 *               - credit_limit
 *             properties:
 *               credit_limit:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Credit limit updated
 */

// Validation rules
const createCustomerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('El teléfono debe tener al menos 10 dígitos'),
  body('tax_id')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const type = req.body.customer_type;
      if (type === 'individual' && value.length !== 13) {
        throw new Error('RFC debe tener 13 caracteres para personas físicas');
      }
      if (type === 'corporate' && value.length !== 12) {
        throw new Error('RFC debe tener 12 caracteres para personas morales');
      }
      return true;
    }),
  body('customer_type')
    .optional()
    .isIn(['individual', 'corporate', 'government'])
    .withMessage('Invalid customer type'),
  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be positive'),
  body('payment_terms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Payment terms must be positive'),
  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100')
];

const updateCustomerValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('El teléfono debe tener al menos 10 dígitos'),
  body('tax_id')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const type = req.body.customer_type;
      if (type === 'individual' && value.length !== 13) {
        throw new Error('RFC debe tener 13 caracteres para personas físicas');
      }
      if (type === 'corporate' && value.length !== 12) {
        throw new Error('RFC debe tener 12 caracteres para personas morales');
      }
      return true;
    }),
  body('customer_type')
    .optional()
    .isIn(['individual', 'corporate', 'government'])
    .withMessage('Invalid customer type'),
  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be positive')
];

const getCustomerByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido')
];

const getCustomerRentalsValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido')
];

const toggleActiveValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido')
];

const updateCreditLimitValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  body('credit_limit')
    .notEmpty().withMessage('El límite de crédito es requerido')
    .isFloat({ min: 0 }).withMessage('El límite de crédito debe ser positivo')
];

const deleteCustomerValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido')
];

const getAllCustomersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100'),
  query('customer_type')
    .optional()
    .isIn(['individual', 'corporate', 'government'])
    .withMessage('Tipo de cliente inválido'),
  query('is_active')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de is_active debe ser true o false')
];

const searchCustomersValidation = [
  query('q')
    .optional()
    .isLength({ max: 100 }).withMessage('La búsqueda no puede exceder 100 caracteres')
];

// All routes require authentication
router.use(authMiddleware);

// GET routes - accessible by most roles
router.get('/', getAllCustomersValidation, customerController.getAll);
router.get('/active', customerController.getActive);
router.get('/search', searchCustomersValidation, customerController.search);
router.get('/statistics', customerController.getStatistics);
router.get('/:id', getCustomerByIdValidation, customerController.getById);
router.get('/:id/rentals', getCustomerRentalsValidation, customerController.getRentals);

// POST/PUT/PATCH/DELETE routes - require specific roles
// POST - Create customer (sales team + admin)
router.post(
  '/',
  requireRole('admin', 'director_general', 'jefe_ventas', 'vendedor'),
  createCustomerValidation,
  customerController.create
);

// PUT - Update customer (sales team + admin)
router.put(
  '/:id',
  requireRole('admin', 'director_general', 'jefe_ventas', 'vendedor'),
  updateCustomerValidation,
  customerController.update
);

// PATCH - Toggle active status (management only)
router.patch(
  '/:id/toggle-active',
  requireRole('admin', 'director_general', 'jefe_ventas', 'jefe_admin'),
  toggleActiveValidation,
  customerController.toggleActive
);

// PATCH - Update credit limit (finance team + admin)
router.patch(
  '/:id/credit-limit',
  requireRole('admin', 'director_general', 'jefe_finanzas', 'contador'),
  updateCreditLimitValidation,
  customerController.updateCreditLimit
);

// DELETE - Delete customer (top management only)
router.delete(
  '/:id',
  requireRole('admin', 'director_general', 'jefe_admin'),
  deleteCustomerValidation,
  customerController.delete
);

export default router;
