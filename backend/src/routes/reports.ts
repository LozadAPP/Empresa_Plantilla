import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  getIncomeReport,
  getOccupancyReport,
  getProfitabilityReport,
  getTopCustomersReport,
  getVehiclePerformanceReport,
  getDashboardSummary,
} from '../controllers/reportController';

const router = Router();

// Apply authentication to all report routes
router.use(authMiddleware);

// Only admin, director, and accountant roles can access reports
router.use(requireRole('admin', 'director', 'accountant'));

/**
 * @swagger
 * /reports/income:
 *   get:
 *     summary: Get income report
 *     description: Generate income report with revenue breakdown
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Income report data
 */

/**
 * @swagger
 * /reports/occupancy:
 *   get:
 *     summary: Get occupancy report
 *     description: Generate fleet occupancy report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Occupancy report data
 */

/**
 * @swagger
 * /reports/profitability:
 *   get:
 *     summary: Get profitability report
 *     description: Generate profitability analysis report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profitability report data
 */

/**
 * @swagger
 * /reports/top-customers:
 *   get:
 *     summary: Get top customers report
 *     description: Generate report of top customers by rental activity
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top customers report data
 */

/**
 * @swagger
 * /reports/vehicle-performance:
 *   get:
 *     summary: Get vehicle performance report
 *     description: Generate vehicle performance metrics report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle performance report data
 */

/**
 * @swagger
 * /reports/dashboard-summary:
 *   get:
 *     summary: Get dashboard summary
 *     description: Get summary data for the dashboard
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */

// GET /api/reports/income - Get income report
router.get('/income', getIncomeReport);

// GET /api/reports/occupancy - Get occupancy report
router.get('/occupancy', getOccupancyReport);

// GET /api/reports/profitability - Get profitability report
router.get('/profitability', getProfitabilityReport);

// GET /api/reports/top-customers - Get top customers report
router.get('/top-customers', getTopCustomersReport);

// GET /api/reports/vehicle-performance - Get vehicle performance report
router.get('/vehicle-performance', getVehiclePerformanceReport);

// GET /api/reports/dashboard-summary - Get dashboard summary
router.get('/dashboard-summary', getDashboardSummary);

export default router;
