import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PaymentController } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /payments/payments:
 *   get:
 *     summary: Get all payments
 *     description: Retrieve a paginated list of payments with optional filters
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: rental_id
 *         schema:
 *           type: integer
 *         description: Filter by rental ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: payment_type
 *         schema:
 *           type: string
 *           enum: [deposit, rental_payment, penalty, refund]
 *         description: Filter by payment type
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
 *         description: List of payments
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
 *                         $ref: '#/components/schemas/Payment'
 *   post:
 *     summary: Create a new payment
 *     description: Register a new payment for a customer/rental
 *     tags: [Payments]
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
 *               - amount
 *               - payment_method
 *               - payment_type
 *             properties:
 *               customer_id:
 *                 type: integer
 *               rental_id:
 *                 type: integer
 *               invoice_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *                 format: decimal
 *               payment_method:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, transfer, check, other]
 *               payment_type:
 *                 type: string
 *                 enum: [deposit, rental_payment, penalty, refund]
 *               reference_number:
 *                 type: string
 *               transaction_date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /payments/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Retrieve a specific payment by its ID
 *     tags: [Payments]
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
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /payments/invoices:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieve a paginated list of invoices with optional filters
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: rental_id
 *         schema:
 *           type: integer
 *         description: Filter by rental ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, paid, overdue, cancelled]
 *         description: Filter by invoice status
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
 *         description: List of invoices
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
 *                         $ref: '#/components/schemas/Invoice'
 *   post:
 *     summary: Create a new invoice
 *     description: Generate a new invoice for a rental
 *     tags: [Invoices]
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
 *               - customer_id
 *             properties:
 *               rental_id:
 *                 type: integer
 *               customer_id:
 *                 type: integer
 *               due_days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 90
 *                 default: 7
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /payments/invoices/overdue:
 *   get:
 *     summary: Get overdue invoices
 *     description: Retrieve all invoices that are past their due date
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue invoices
 */

/**
 * @swagger
 * /payments/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     description: Retrieve a specific invoice by its ID
 *     tags: [Invoices]
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
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /payments/invoices/{id}/send:
 *   post:
 *     summary: Send/resend invoice
 *     description: Send or resend an invoice by email to the customer
 *     tags: [Invoices]
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
 *         description: Invoice sent successfully
 *       404:
 *         description: Invoice not found
 */

// ========== PAYMENT VALIDATIONS ==========
const createPaymentValidation = [
  body('customer_id')
    .notEmpty().withMessage('El ID del cliente es requerido')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  body('rental_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  body('invoice_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la factura debe ser un número válido'),
  body('amount')
    .notEmpty().withMessage('El monto es requerido')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto debe ser un número válido')
    .custom((value) => Number.parseFloat(value) > 0).withMessage('El monto debe ser mayor a 0'),
  body('payment_method')
    .notEmpty().withMessage('El método de pago es requerido')
    .isIn(['cash', 'credit_card', 'debit_card', 'transfer', 'check', 'other'])
    .withMessage('Método de pago inválido'),
  body('payment_type')
    .notEmpty().withMessage('El tipo de pago es requerido')
    .isIn(['deposit', 'rental_payment', 'penalty', 'refund'])
    .withMessage('Tipo de pago inválido'),
  body('reference_number')
    .optional()
    .isLength({ max: 100 }).withMessage('El número de referencia no puede exceder 100 caracteres'),
  body('transaction_date')
    .optional()
    .isISO8601().withMessage('La fecha de transacción debe ser una fecha válida'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const getPaymentByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del pago debe ser un número válido')
];

const getAllPaymentsValidation = [
  query('customer_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  query('rental_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Estado de pago inválido'),
  query('payment_type')
    .optional()
    .isIn(['deposit', 'rental_payment', 'penalty', 'refund'])
    .withMessage('Tipo de pago inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
];

// ========== INVOICE VALIDATIONS ==========
const createInvoiceValidation = [
  body('rental_id')
    .notEmpty().withMessage('El ID de la renta es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  body('customer_id')
    .notEmpty().withMessage('El ID del cliente es requerido')
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  body('due_days')
    .optional()
    .isInt({ min: 1, max: 90 }).withMessage('Los días de vencimiento deben ser entre 1 y 90'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const getInvoiceByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la factura debe ser un número válido')
];

const getAllInvoicesValidation = [
  query('customer_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  query('rental_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la renta debe ser un número válido'),
  query('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Estado de factura inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
];

const resendInvoiceValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la factura debe ser un número válido')
];

// Aplicar authMiddleware a TODAS las rutas de este módulo
router.use(authMiddleware);

// ========== PAGOS ==========
// GET /api/v1/payments - Obtener todos los pagos
router.get('/', getAllPaymentsValidation, PaymentController.getAllPayments);

// GET /api/v1/payments/:id - Obtener un pago por ID
router.get('/:id', getPaymentByIdValidation, PaymentController.getPaymentById);

// POST /api/v1/payments - Registrar un nuevo pago
router.post('/', createPaymentValidation, PaymentController.createPayment);

export default router;

// ========== INVOICE ROUTER (separado) ==========
export const invoiceRouter = Router();
invoiceRouter.use(authMiddleware);

// GET /api/v1/invoices - Obtener todas las facturas
invoiceRouter.get('/', getAllInvoicesValidation, PaymentController.getAllInvoices);

// GET /api/v1/invoices/overdue - Obtener facturas vencidas
// IMPORTANTE: Esta ruta debe ir ANTES de /:id
invoiceRouter.get('/overdue', PaymentController.getOverdueInvoices);

// GET /api/v1/invoices/:id - Obtener una factura por ID
invoiceRouter.get('/:id', getInvoiceByIdValidation, PaymentController.getInvoiceById);

// POST /api/v1/invoices - Crear una nueva factura
invoiceRouter.post('/', createInvoiceValidation, PaymentController.createInvoice);

// POST /api/v1/invoices/:id/send - Reenviar factura por email
invoiceRouter.post('/:id/send', resendInvoiceValidation, PaymentController.resendInvoice);
