import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats,
  getRoles,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of users with optional filters
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of users
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
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin/director/manager role
 *   post:
 *     summary: Create a new user
 *     description: Create a new system user (admin/director only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               location_id:
 *                 type: integer
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Get statistics about system users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users/roles:
 *   get:
 *     summary: Get available roles
 *     description: Get list of available roles for dropdown
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
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
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                       label:
 *                         type: string
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user
 *     description: Update an existing user (admin/director only)
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *                 format: email
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               location_id:
 *                 type: integer
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}/toggle:
 *   post:
 *     summary: Toggle user status
 *     description: Activate or deactivate a user account
 *     tags: [Users]
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
 *         description: User status toggled
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset another user's password (admin/director only)
 *     tags: [Users]
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: User not found
 */

// ====================================
// USER ROUTES
// Todas las rutas requieren autenticación
// Algunas requieren rol de administrador
// ====================================

// Regex para contraseña fuerte: mín 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo (@$!%*?&)';

// Validation rules
const createUserValidation = [
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .matches(strongPasswordRegex).withMessage(passwordMessage),
  body('first_name')
    .notEmpty().withMessage('El nombre es requerido')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('last_name')
    .notEmpty().withMessage('El apellido es requerido')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('any').withMessage('Número de teléfono inválido'),
  body('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  body('roles')
    .optional()
    .isArray().withMessage('Los roles deben ser un arreglo')
];

const updateUserValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del usuario debe ser un número válido'),
  body('email')
    .optional()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('any').withMessage('Número de teléfono inválido'),
  body('location_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de ubicación debe ser un número válido'),
  body('roles')
    .optional()
    .isArray().withMessage('Los roles deben ser un arreglo')
];

const getUserByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del usuario debe ser un número válido')
];

const toggleUserStatusValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del usuario debe ser un número válido')
];

const resetPasswordValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del usuario debe ser un número válido'),
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const getAllUsersValidation = [
  query('search')
    .optional()
    .isLength({ max: 100 }).withMessage('La búsqueda no puede exceder 100 caracteres'),
  query('role')
    .optional()
    .isLength({ max: 50 }).withMessage('El rol no puede exceder 50 caracteres'),
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

// Aplicar authMiddleware a TODAS las rutas de este módulo
router.use(authMiddleware);

// GET /api/users - Get all users with filters and pagination
router.get('/', requireRole('admin', 'director', 'manager'), getAllUsersValidation, getUsers);

// GET /api/users/stats - Get user statistics (solo admin)
router.get('/stats', requireRole('admin', 'director', 'manager'), getUserStats);

// GET /api/users/roles - Get all roles (for dropdown)
router.get('/roles', requireRole('admin', 'director', 'manager'), getRoles);

// GET /api/users/:id - Get user by ID
router.get('/:id', requireRole('admin', 'director', 'manager'), getUserByIdValidation, getUserById);

// POST /api/users - Create new user (solo admin/director)
router.post('/', requireRole('admin', 'director'), createUserValidation, createUser);

// PUT /api/users/:id - Update user (solo admin/director)
router.put('/:id', requireRole('admin', 'director'), updateUserValidation, updateUser);

// POST /api/users/:id/toggle - Toggle user active status (solo admin/director)
router.post('/:id/toggle', requireRole('admin', 'director'), toggleUserStatusValidation, toggleUserStatus);

// POST /api/users/:id/reset-password - Reset user password (solo admin/director)
router.post('/:id/reset-password', requireRole('admin', 'director'), resetPasswordValidation, resetUserPassword);

export default router;
