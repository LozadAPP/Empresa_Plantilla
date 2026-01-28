import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

/**
 * @swagger
 * /inventory/items:
 *   get:
 *     summary: Get all inventory items
 *     description: Retrieve a paginated list of inventory items with optional filters
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, rented, maintenance, retired]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or serial number
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
 *         description: List of inventory items
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
 *                         $ref: '#/components/schemas/InventoryItem'
 *   post:
 *     summary: Create inventory item
 *     description: Add a new item to the inventory
 *     tags: [Inventory]
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
 *               serialNumber:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               categoryName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, rented, maintenance, retired]
 *               currentLocationId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 */

/**
 * @swagger
 * /inventory/items/{id}:
 *   get:
 *     summary: Get inventory item by ID
 *     description: Retrieve a specific inventory item by its ID
 *     tags: [Inventory]
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
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: Item not found
 *   put:
 *     summary: Update inventory item
 *     description: Update an existing inventory item
 *     tags: [Inventory]
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
 *               serialNumber:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, rented, maintenance, retired]
 *               currentLocationId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *   delete:
 *     summary: Delete inventory item
 *     description: Remove an item from the inventory
 *     tags: [Inventory]
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
 *         description: Item deleted successfully
 */

/**
 * @swagger
 * /inventory/movements:
 *   get:
 *     summary: Get all movements
 *     description: Retrieve a paginated list of inventory movements
 *     tags: [Inventory]
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
 *     responses:
 *       200:
 *         description: List of movements
 *   post:
 *     summary: Create a movement
 *     description: Register a new inventory movement (entry, exit, or transfer)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - movementType
 *               - toLocationId
 *             properties:
 *               itemId:
 *                 type: integer
 *               movementType:
 *                 type: string
 *                 enum: [entry, exit, transfer]
 *               movementSubtype:
 *                 type: string
 *                 enum: [purchase, return, rental, maintenance, relocation, other]
 *               toLocationId:
 *                 type: integer
 *               fromLocationId:
 *                 type: integer
 *               customerId:
 *                 type: integer
 *               expectedReturnDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movement created successfully
 */

/**
 * @swagger
 * /inventory/movements/{itemId}/history:
 *   get:
 *     summary: Get item movement history
 *     description: Retrieve the movement history for a specific item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movement history for the item
 */

/**
 * @swagger
 * /inventory/movements/{id}/document:
 *   get:
 *     summary: Download movement document
 *     description: Download the PDF document for a specific movement
 *     tags: [Inventory]
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
 *         description: PDF document
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /inventory/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all inventory categories
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */

/**
 * @swagger
 * /inventory/locations:
 *   get:
 *     summary: Get all locations (for inventory)
 *     description: Retrieve all locations for inventory management
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of locations
 */

// ========== ITEM VALIDATIONS ==========
const createItemValidation = [
  body('name')
    .notEmpty().withMessage('El nombre del artículo es requerido')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El número de serie no puede exceder 50 caracteres'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido'),
  body('categoryName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El nombre de categoría no puede exceder 50 caracteres'),
  body('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance', 'retired'])
    .withMessage('Estado de artículo inválido'),
  body('currentLocationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

const updateItemValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del artículo debe ser un número válido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El número de serie no puede exceder 50 caracteres'),
  body('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance', 'retired'])
    .withMessage('Estado de artículo inválido'),
  body('currentLocationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

const getItemByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del artículo debe ser un número válido')
];

const deleteItemValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del artículo debe ser un número válido')
];

const getAllItemsValidation = [
  query('category')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido'),
  query('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance', 'retired'])
    .withMessage('Estado de artículo inválido'),
  query('search')
    .optional()
    .isLength({ max: 100 }).withMessage('La búsqueda no puede exceder 100 caracteres'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
];

// ========== MOVEMENT VALIDATIONS ==========
const createMovementValidation = [
  body('itemId')
    .notEmpty().withMessage('El ID del artículo es requerido')
    .isInt({ min: 1 }).withMessage('El ID del artículo debe ser un número válido'),
  body('movementType')
    .notEmpty().withMessage('El tipo de movimiento es requerido')
    .isIn(['entry', 'exit', 'transfer'])
    .withMessage('Tipo de movimiento inválido'),
  body('movementSubtype')
    .optional()
    .isIn(['purchase', 'return', 'rental', 'maintenance', 'relocation', 'other'])
    .withMessage('Subtipo de movimiento inválido'),
  body('toLocationId')
    .notEmpty().withMessage('El ID de ubicación destino es requerido')
    .isInt({ min: 1 }).withMessage('El ID de ubicación destino debe ser un número válido'),
  body('fromLocationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación origen debe ser un número válido'),
  body('customerId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número válido'),
  body('expectedReturnDate')
    .optional()
    .isISO8601().withMessage('La fecha de retorno esperada debe ser una fecha válida'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const getItemHistoryValidation = [
  param('itemId')
    .isInt({ min: 1 }).withMessage('El ID del artículo debe ser un número válido')
];

const downloadDocumentValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del movimiento debe ser un número válido')
];

const getAllMovementsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100'),
  query('movementType')
    .optional()
    .isIn(['entry', 'exit', 'transfer'])
    .withMessage('Tipo de movimiento inválido'),
  query('movementSubtype')
    .optional()
    .isIn(['rental', 'sale', 'purchase', 'return', 'maintenance', 'relocation'])
    .withMessage('Subtipo de movimiento inválido'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida (debe ser ISO 8601)'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida (debe ser ISO 8601)'),
  query('locationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de ubicación inválido'),
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de categoría inválido'),
  query('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de cliente inválido'),
  query('itemId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de artículo inválido'),
  query('documentGenerated')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Valor de documentGenerated inválido (debe ser true o false)'),
  query('sortBy')
    .optional()
    .isIn(['movementDate', 'movementNumber', 'itemName'])
    .withMessage('Campo de ordenamiento inválido'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Orden inválido (debe ser ASC o DESC)')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Artículos
router.get('/items', getAllItemsValidation, inventoryController.getAllItems);
router.get('/items/:id', getItemByIdValidation, inventoryController.getItemById);
router.post('/items', createItemValidation, inventoryController.createItem);
router.put('/items/:id', updateItemValidation, inventoryController.updateItem);
router.delete('/items/:id', deleteItemValidation, inventoryController.deleteItem);

// Movimientos
router.get('/movements', getAllMovementsValidation, inventoryController.getAllMovements);
router.get('/movements/:itemId/history', getItemHistoryValidation, inventoryController.getItemHistory);
router.get('/movements/:id/document', downloadDocumentValidation, inventoryController.downloadMovementDocument);
router.post('/movements', createMovementValidation, inventoryController.createMovement);

// Estadísticas
router.get('/stats', inventoryController.getInventoryStats);

// Categorías
router.get('/categories', inventoryController.getAllCategories);

// Ubicaciones
router.get('/locations', inventoryController.getAllLocations);
router.post('/locations', [
  body('name').notEmpty().withMessage('El nombre es requerido').trim(),
  body('address').notEmpty().withMessage('La dirección es requerida').trim(),
  body('city').notEmpty().withMessage('La ciudad es requerida').trim(),
  body('state').notEmpty().withMessage('El estado es requerido').trim(),
  body('country').optional().trim(),
  body('coordinates').optional().isObject().withMessage('Las coordenadas deben ser un objeto'),
], inventoryController.createLocation);

export default router;
