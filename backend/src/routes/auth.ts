import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and return JWT tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@movicar.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags: [Auth]
 *     security: []
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
 *                 example: newuser@movicar.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
 *                 example: Password123!
 *               first_name:
 *                 type: string
 *                 minLength: 2
 *                 example: John
 *               last_name:
 *                 type: string
 *                 minLength: 2
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               location_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using the refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate the current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change the authenticated user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Current password is incorrect
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent (if email exists)
 *       429:
 *         description: Too many requests
 */

/**
 * @swagger
 * /auth/verify-reset-token:
 *   post:
 *     summary: Verify reset token
 *     description: Check if a password reset token is valid
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Token is invalid or expired
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset the password using a valid reset token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or validation error
 */

// Rate limiting para proteger contra ataques de fuerza bruta
// En desarrollo/testing se permite más intentos para facilitar pruebas automatizadas
const isDevelopment = process.env.NODE_ENV !== 'production';
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 100 : 5, // 100 en desarrollo, 5 en producción
  message: {
    success: false,
    message: 'Demasiados intentos de login. Por favor espera 15 minutos antes de intentar de nuevo.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDevelopment ? 50 : 3, // 50 en desarrollo, 3 en producción
  message: {
    success: false,
    message: 'Demasiadas solicitudes de recuperación. Por favor espera 1 hora antes de intentar de nuevo.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor proporciona un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Regex para contraseña fuerte: mín 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo (@$!%*?&)';

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor proporciona un email válido'),
  body('password')
    .matches(strongPasswordRegex)
    .withMessage(passwordMessage),
  body('first_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres'),
  body('last_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El apellido debe tener al menos 2 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Por favor proporciona un número de teléfono válido'),
  body('location_id')
    .optional()
    .isInt()
    .withMessage('El ID de ubicación debe ser un número')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .matches(strongPasswordRegex)
    .withMessage(passwordMessage)
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor proporciona un email válido')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('El token es requerido'),
  body('newPassword')
    .matches(strongPasswordRegex)
    .withMessage(passwordMessage)
];

// Routes
// Login con rate limiting para prevenir ataques de fuerza bruta
router.post('/login', loginLimiter, loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.post('/change-password', authMiddleware, changePasswordValidation, authController.changePassword);
// Forgot password con rate limiting
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

export default router;
