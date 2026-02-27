import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  getAccounts,
  createAccount,
  updateAccount,
  getTransactions,
  createTransaction,
  approveTransaction,
  cancelTransaction,
  migrateToDoubleEntry,
  getBalanceSheet,
  getIncomeStatement,
  getTrialBalance,
} from '../controllers/accountingController';

const router = Router();

// Apply authentication to all accounting routes
router.use(authMiddleware);

// Roles allowed to access accounting
router.use(requireRole('admin', 'director_general', 'jefe_finanzas', 'contador', 'jefe_admin'));

/**
 * @swagger
 * /accounting/accounts:
 *   get:
 *     summary: Get all accounts
 *     description: Retrieve all accounting accounts (chart of accounts)
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountType
 *         schema:
 *           type: string
 *           enum: [asset, liability, equity, income, expense]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of accounts
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
 *                     $ref: '#/components/schemas/Account'
 *   post:
 *     summary: Create account
 *     description: Create a new accounting account
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountCode
 *               - accountName
 *               - accountType
 *             properties:
 *               accountCode:
 *                 type: string
 *               accountName:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [asset, liability, equity, income, expense]
 *               parentAccountId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 */

/**
 * @swagger
 * /accounting/accounts/{id}:
 *   put:
 *     summary: Update account
 *     description: Update an existing accounting account
 *     tags: [Accounting]
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
 *               accountCode:
 *                 type: string
 *               accountName:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [asset, liability, equity, income, expense]
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 */

/**
 * @swagger
 * /accounting/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve all accounting transactions with filters
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: locationId
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
 *         description: List of transactions
 *   post:
 *     summary: Create transaction
 *     description: Create a new accounting transaction
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionType
 *               - accountId
 *               - amount
 *             properties:
 *               transactionType:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               accountId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               referenceType:
 *                 type: string
 *                 enum: [rental, payment, invoice, maintenance, other]
 *               referenceId:
 *                 type: integer
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, transfer, check, other]
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *               locationId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 */

/**
 * @swagger
 * /accounting/transactions/{id}/approve:
 *   post:
 *     summary: Approve transaction
 *     description: Approve a pending transaction
 *     tags: [Accounting]
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
 *         description: Transaction approved
 */

/**
 * @swagger
 * /accounting/transactions/{id}/cancel:
 *   post:
 *     summary: Cancel transaction
 *     description: Cancel a transaction
 *     tags: [Accounting]
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
 *     responses:
 *       200:
 *         description: Transaction cancelled
 */

/**
 * @swagger
 * /accounting/reports/balance-sheet:
 *   get:
 *     summary: Get balance sheet
 *     description: Generate balance sheet report
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance sheet data
 */

/**
 * @swagger
 * /accounting/reports/income-statement:
 *   get:
 *     summary: Get income statement
 *     description: Generate income statement report
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Income statement data
 */

// ====================================
// ACCOUNTS VALIDATIONS
// ====================================

const createAccountValidation = [
  body('accountCode')
    .notEmpty().withMessage('El código de cuenta es requerido')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('El código de cuenta debe tener entre 1 y 20 caracteres'),
  body('accountName')
    .notEmpty().withMessage('El nombre de la cuenta es requerido')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre de la cuenta debe tener entre 2 y 100 caracteres'),
  body('accountType')
    .notEmpty().withMessage('El tipo de cuenta es requerido')
    .isIn(['asset', 'liability', 'equity', 'income', 'expense'])
    .withMessage('Tipo de cuenta inválido'),
  body('parentAccountId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la cuenta padre debe ser un número válido'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

const updateAccountValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la cuenta debe ser un número válido'),
  body('accountCode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('El código de cuenta debe tener entre 1 y 20 caracteres'),
  body('accountName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre de la cuenta debe tener entre 2 y 100 caracteres'),
  body('accountType')
    .optional()
    .isIn(['asset', 'liability', 'equity', 'income', 'expense'])
    .withMessage('Tipo de cuenta inválido'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('El valor de isActive debe ser booleano'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

const getAllAccountsValidation = [
  query('accountType')
    .optional()
    .isIn(['asset', 'liability', 'equity', 'income', 'expense'])
    .withMessage('Tipo de cuenta inválido'),
  query('isActive')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de isActive debe ser true o false')
];

// ====================================
// TRANSACTIONS VALIDATIONS
// ====================================

const createTransactionValidation = [
  body('transactionType')
    .notEmpty().withMessage('El tipo de transacción es requerido')
    .isIn(['income', 'expense', 'transfer'])
    .withMessage('Tipo de transacción inválido'),
  body('accountId')
    .notEmpty().withMessage('El ID de la cuenta es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la cuenta debe ser un número válido'),
  body('destinationAccountId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la cuenta destino debe ser un número válido'),
  body('amount')
    .notEmpty().withMessage('El monto es requerido')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto debe ser un número válido')
    .custom((value) => Number.parseFloat(value) > 0).withMessage('El monto debe ser mayor a 0'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('referenceType')
    .optional()
    .isIn(['rental', 'payment', 'invoice', 'maintenance', 'other'])
    .withMessage('Tipo de referencia inválido'),
  body('referenceId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de referencia debe ser un número válido'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'transfer', 'check', 'other'])
    .withMessage('Método de pago inválido'),
  body('transactionDate')
    .optional()
    .isISO8601().withMessage('La fecha de transacción debe ser una fecha válida'),
  body('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const getTransactionByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la transacción debe ser un número válido')
];

const cancelTransactionValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la transacción debe ser un número válido'),
  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('La razón no puede exceder 500 caracteres')
];

const getAllTransactionsValidation = [
  query('transactionType')
    .optional()
    .isIn(['income', 'expense', 'transfer'])
    .withMessage('Tipo de transacción inválido'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Estado de transacción inválido'),
  query('accountId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la cuenta debe ser un número válido'),
  query('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
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

const getIncomeStatementValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('La fecha de fin debe ser una fecha válida')
];

// ====================================
// ACCOUNTS ROUTES
// ====================================

// GET /api/accounting/accounts - Get all accounts
router.get('/accounts', getAllAccountsValidation, getAccounts);

// POST /api/accounting/accounts - Create new account
router.post('/accounts', createAccountValidation, createAccount);

// PUT /api/accounting/accounts/:id - Update account
router.put('/accounts/:id', updateAccountValidation, updateAccount);

// ====================================
// TRANSACTIONS ROUTES
// ====================================

// GET /api/accounting/transactions - Get all transactions
router.get('/transactions', getAllTransactionsValidation, getTransactions);

// POST /api/accounting/transactions - Create new transaction
router.post('/transactions', createTransactionValidation, createTransaction);

// POST /api/accounting/transactions/:id/approve - Approve transaction
router.post('/transactions/:id/approve', getTransactionByIdValidation, approveTransaction);

// POST /api/accounting/transactions/:id/cancel - Cancel transaction
router.post('/transactions/:id/cancel', cancelTransactionValidation, cancelTransaction);

// ====================================
// MIGRATION ROUTES (one-time, admin only)
// ====================================

// POST /api/accounting/migrate-double-entry - Migrate existing transactions to double-entry
router.post('/migrate-double-entry', migrateToDoubleEntry);

// ====================================
// REPORTS ROUTES
// ====================================

// GET /api/accounting/reports/balance-sheet - Get balance sheet
router.get('/reports/balance-sheet', getBalanceSheet);

// GET /api/accounting/reports/income-statement - Get income statement
router.get('/reports/income-statement', getIncomeStatementValidation, getIncomeStatement);

// GET /api/accounting/reports/trial-balance - Get trial balance
const getTrialBalanceValidation = [
  query('asOfDate')
    .optional()
    .isISO8601().withMessage('La fecha debe ser una fecha válida'),
];
router.get('/reports/trial-balance', getTrialBalanceValidation, getTrialBalance);

export default router;
