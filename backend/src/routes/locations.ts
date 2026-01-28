import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  toggleLocationStatus,
  getLocationStats,
  getLocationsDropdown,
} from '../controllers/locationController';

const router = Router();

// Apply authentication to all location routes
router.use(authMiddleware);

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Get all locations
 *     description: Retrieve all locations with optional filters
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [office, warehouse, maintenance, other]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
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
 *         description: List of locations
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
 *                     $ref: '#/components/schemas/Location'
 *   post:
 *     summary: Create a new location
 *     description: Create a new location/branch
 *     tags: [Locations]
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
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               type:
 *                 type: string
 *                 enum: [office, warehouse, maintenance, other]
 *               contactName:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created successfully
 */

/**
 * @swagger
 * /locations/stats:
 *   get:
 *     summary: Get location statistics
 *     description: Get statistics about locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location statistics
 */

/**
 * @swagger
 * /locations/dropdown:
 *   get:
 *     summary: Get locations for dropdown
 *     description: Get active locations with minimal data for dropdowns
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of locations for dropdown
 */

/**
 * @swagger
 * /locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     description: Retrieve a specific location by its ID
 *     tags: [Locations]
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
 *         description: Location details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *   put:
 *     summary: Update location
 *     description: Update an existing location
 *     tags: [Locations]
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
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [office, warehouse, maintenance, other]
 *               contactEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Location updated successfully
 */

/**
 * @swagger
 * /locations/{id}/toggle:
 *   post:
 *     summary: Toggle location status
 *     description: Activate or deactivate a location
 *     tags: [Locations]
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
 *         description: Location status toggled
 */

// ====================================
// LOCATION ROUTES
// ====================================

// Validation rules
const createLocationValidation = [
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La dirección no puede exceder 200 caracteres'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El estado no puede exceder 100 caracteres'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El país no puede exceder 100 caracteres'),
  body('zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El código postal no puede exceder 20 caracteres'),
  body('coordinates')
    .optional()
    .isObject().withMessage('Las coordenadas deben ser un objeto'),
  body('coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('La latitud debe estar entre -90 y 90'),
  body('coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('La longitud debe estar entre -180 y 180'),
  body('type')
    .optional()
    .isIn(['office', 'warehouse', 'maintenance', 'other'])
    .withMessage('Tipo de ubicación inválido'),
  body('contactName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre de contacto no puede exceder 100 caracteres'),
  body('contactPhone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono de contacto no puede exceder 20 caracteres'),
  body('contactEmail')
    .optional()
    .isEmail().withMessage('Email de contacto inválido')
    .normalizeEmail(),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const updateLocationValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la ubicación debe ser un número válido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La dirección no puede exceder 200 caracteres'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El estado no puede exceder 100 caracteres'),
  body('type')
    .optional()
    .isIn(['office', 'warehouse', 'maintenance', 'other'])
    .withMessage('Tipo de ubicación inválido'),
  body('contactEmail')
    .optional()
    .isEmail().withMessage('Email de contacto inválido')
    .normalizeEmail()
];

const getLocationByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la ubicación debe ser un número válido')
];

const toggleLocationStatusValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la ubicación debe ser un número válido')
];

const getAllLocationsValidation = [
  query('search')
    .optional()
    .isLength({ max: 100 }).withMessage('La búsqueda no puede exceder 100 caracteres'),
  query('type')
    .optional()
    .isIn(['office', 'warehouse', 'maintenance', 'other'])
    .withMessage('Tipo de ubicación inválido'),
  query('isActive')
    .optional()
    .isIn(['true', 'false']).withMessage('El valor de isActive debe ser true o false'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
];

// GET /api/locations - Get all locations with filters and pagination
router.get('/', getAllLocationsValidation, getLocations);

// GET /api/locations/stats - Get location statistics
router.get('/stats', getLocationStats);

// GET /api/locations/dropdown - Get locations for dropdown (active only, minimal data)
router.get('/dropdown', getLocationsDropdown);

// GET /api/locations/:id - Get location by ID
router.get('/:id', getLocationByIdValidation, getLocationById);

// POST /api/locations - Create new location
router.post('/', createLocationValidation, createLocation);

// PUT /api/locations/:id - Update location
router.put('/:id', updateLocationValidation, updateLocation);

// POST /api/locations/:id/toggle - Toggle location active status
router.post('/:id/toggle', toggleLocationStatusValidation, toggleLocationStatus);

export default router;
