import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  getSystemConfigs,
  getConfigByKey,
  updateSystemConfig,
  createSystemConfig,
  getPriceConfigs,
  getActivePriceConfig,
  createPriceConfig,
  updatePriceConfig,
  deactivatePriceConfig,
} from '../controllers/configController';

const router = Router();

// Apply authentication to all config routes
router.use(authMiddleware);

// Only admin and director_general can modify system configuration
router.use(requireRole('admin', 'director_general'));

/**
 * @swagger
 * /config/system:
 *   get:
 *     summary: Get all system configs
 *     description: Retrieve all system configuration values
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, rental, payment, email, notification, security, other]
 *     responses:
 *       200:
 *         description: List of system configurations
 *   post:
 *     summary: Create system config
 *     description: Create a new system configuration
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - configKey
 *               - configValue
 *             properties:
 *               configKey:
 *                 type: string
 *               configValue:
 *                 type: string
 *               configType:
 *                 type: string
 *                 enum: [string, number, boolean, json]
 *               category:
 *                 type: string
 *                 enum: [general, rental, payment, email, notification, security, other]
 *               description:
 *                 type: string
 *               isEditable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Config created successfully
 */

/**
 * @swagger
 * /config/system/key/{key}:
 *   get:
 *     summary: Get config by key
 *     description: Retrieve a specific configuration by its key
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Config value
 *       404:
 *         description: Config not found
 */

/**
 * @swagger
 * /config/system/{id}:
 *   put:
 *     summary: Update system config
 *     description: Update an existing system configuration
 *     tags: [Config]
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
 *             required:
 *               - configValue
 *             properties:
 *               configValue:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Config updated successfully
 */

/**
 * @swagger
 * /config/pricing:
 *   get:
 *     summary: Get all price configs
 *     description: Retrieve all pricing configurations
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleTypeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of pricing configurations
 *   post:
 *     summary: Create price config
 *     description: Create a new pricing configuration
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleTypeId
 *               - dailyRate
 *               - effectiveFrom
 *             properties:
 *               vehicleTypeId:
 *                 type: integer
 *               locationId:
 *                 type: integer
 *               season:
 *                 type: string
 *                 enum: [low, mid, high, holiday]
 *               dailyRate:
 *                 type: number
 *               weeklyRate:
 *                 type: number
 *               monthlyRate:
 *                 type: number
 *               minimumRentalDays:
 *                 type: integer
 *               discountPercentage:
 *                 type: number
 *               extraHourRate:
 *                 type: number
 *               extraDayRate:
 *                 type: number
 *               insuranceRate:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *               lateFeePerDay:
 *                 type: number
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               effectiveUntil:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Price config created successfully
 */

/**
 * @swagger
 * /config/pricing/active:
 *   get:
 *     summary: Get active price config
 *     description: Retrieve the currently active pricing configuration
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleTypeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Active pricing configuration
 */

/**
 * @swagger
 * /config/pricing/{id}:
 *   put:
 *     summary: Update price config
 *     description: Update an existing pricing configuration
 *     tags: [Config]
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
 *               dailyRate:
 *                 type: number
 *               weeklyRate:
 *                 type: number
 *               monthlyRate:
 *                 type: number
 *               discountPercentage:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               effectiveUntil:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Price config updated successfully
 */

/**
 * @swagger
 * /config/pricing/{id}/deactivate:
 *   post:
 *     summary: Deactivate price config
 *     description: Deactivate a pricing configuration
 *     tags: [Config]
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
 *         description: Price config deactivated
 */

// ====================================
// SYSTEM CONFIG VALIDATIONS
// ====================================

const createSystemConfigValidation = [
  body('configKey')
    .notEmpty().withMessage('La clave de configuración es requerida')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('La clave debe tener entre 1 y 100 caracteres')
    .matches(/^\w+$/).withMessage('La clave solo puede contener letras, números y guiones bajos'),
  body('configValue')
    .notEmpty().withMessage('El valor de configuración es requerido')
    .isLength({ max: 1000 }).withMessage('El valor no puede exceder 1000 caracteres'),
  body('configType')
    .optional()
    .isIn(['string', 'number', 'boolean', 'json'])
    .withMessage('Tipo de configuración inválido'),
  body('category')
    .optional()
    .isIn(['general', 'rental', 'payment', 'email', 'notification', 'security', 'other'])
    .withMessage('Categoría inválida'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('isEditable')
    .optional()
    .isBoolean().withMessage('El valor de isEditable debe ser booleano')
];

const updateSystemConfigValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la configuración debe ser un número válido'),
  body('configValue')
    .notEmpty().withMessage('El valor de configuración es requerido')
    .isLength({ max: 1000 }).withMessage('El valor no puede exceder 1000 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

const getConfigByKeyValidation = [
  param('key')
    .notEmpty().withMessage('La clave es requerida')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('La clave solo puede contener letras, números y guiones bajos')
];

const getAllSystemConfigsValidation = [
  query('category')
    .optional()
    .isIn(['general', 'rental', 'payment', 'email', 'notification', 'security', 'other'])
    .withMessage('Categoría inválida')
];

// ====================================
// PRICE CONFIG VALIDATIONS
// ====================================

const createPriceConfigValidation = [
  body('vehicleTypeId')
    .notEmpty().withMessage('El ID del tipo de vehículo es requerido')
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido'),
  body('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  body('season')
    .optional()
    .isIn(['low', 'mid', 'high', 'holiday'])
    .withMessage('Temporada inválida'),
  body('dailyRate')
    .notEmpty().withMessage('La tarifa diaria es requerida')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa diaria debe ser un número válido'),
  body('weeklyRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa semanal debe ser un número válido'),
  body('monthlyRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa mensual debe ser un número válido'),
  body('minimumRentalDays')
    .optional()
    .isInt({ min: 1 }).withMessage('Los días mínimos de renta deben ser un número positivo'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('El porcentaje de descuento debe estar entre 0 y 100'),
  body('extraHourRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa por hora extra debe ser un número válido'),
  body('extraDayRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa por día extra debe ser un número válido'),
  body('insuranceRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa de seguro debe ser un número válido'),
  body('depositAmount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El monto de depósito debe ser un número válido'),
  body('lateFeePerDay')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa de penalización por día debe ser un número válido'),
  body('effectiveFrom')
    .notEmpty().withMessage('La fecha de inicio de vigencia es requerida')
    .isISO8601().withMessage('La fecha de inicio de vigencia debe ser una fecha válida'),
  body('effectiveUntil')
    .optional()
    .isISO8601().withMessage('La fecha de fin de vigencia debe ser una fecha válida'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const updatePriceConfigValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la configuración de precios debe ser un número válido'),
  body('dailyRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa diaria debe ser un número válido'),
  body('weeklyRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa semanal debe ser un número válido'),
  body('monthlyRate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('La tarifa mensual debe ser un número válido'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('El porcentaje de descuento debe estar entre 0 y 100'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('El valor de isActive debe ser booleano'),
  body('effectiveUntil')
    .optional()
    .isISO8601().withMessage('La fecha de fin de vigencia debe ser una fecha válida'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const getActivePriceConfigValidation = [
  query('vehicleTypeId')
    .notEmpty().withMessage('El ID del tipo de vehículo es requerido')
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido'),
  query('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido')
];

const getAllPriceConfigsValidation = [
  query('vehicleTypeId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del tipo de vehículo debe ser un número válido'),
  query('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  query('isActive')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de isActive debe ser true o false')
];

const deactivatePriceConfigValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la configuración de precios debe ser un número válido')
];

// ====================================
// SYSTEM CONFIGURATION ROUTES
// ====================================

// GET /api/config/system/key/:key - Get config by key (specific route must come first)
router.get('/system/key/:key', getConfigByKeyValidation, getConfigByKey);

// GET /api/config/system - Get all system configs
router.get('/system', getAllSystemConfigsValidation, getSystemConfigs);

// POST /api/config/system - Create new system config
router.post('/system', createSystemConfigValidation, createSystemConfig);

// PUT /api/config/system/:id - Update system config
router.put('/system/:id', updateSystemConfigValidation, updateSystemConfig);

// ====================================
// PRICE CONFIGURATION ROUTES
// ====================================

// GET /api/config/pricing - Get all price configs
router.get('/pricing', getAllPriceConfigsValidation, getPriceConfigs);

// GET /api/config/pricing/active - Get active price config
router.get('/pricing/active', getActivePriceConfigValidation, getActivePriceConfig);

// POST /api/config/pricing - Create new price config
router.post('/pricing', createPriceConfigValidation, createPriceConfig);

// PUT /api/config/pricing/:id - Update price config
router.put('/pricing/:id', updatePriceConfigValidation, updatePriceConfig);

// POST /api/config/pricing/:id/deactivate - Deactivate price config
router.post('/pricing/:id/deactivate', deactivatePriceConfigValidation, deactivatePriceConfig);

export default router;
