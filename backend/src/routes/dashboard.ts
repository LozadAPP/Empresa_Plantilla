import { Router } from 'express';
import dashboardController from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get main dashboard data
 *     description: Retrieve main dashboard metrics and data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */

/**
 * @swagger
 * /dashboard/kpis:
 *   get:
 *     summary: Get dashboard KPIs
 *     description: Retrieve key performance indicators for the dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs retrieved successfully
 */

/**
 * @swagger
 * /dashboard/alerts:
 *   get:
 *     summary: Get dashboard alerts
 *     description: Retrieve alerts summary for the dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 */

/**
 * @swagger
 * /dashboard/vehicles-by-location:
 *   get:
 *     summary: Get vehicles by location
 *     description: Get vehicle distribution by location
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle distribution data
 */

/**
 * @swagger
 * /dashboard/occupancy-trend:
 *   get:
 *     summary: Get occupancy trend
 *     description: Get fleet occupancy trend over time
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Occupancy trend data
 */

/**
 * @swagger
 * /dashboard/top-customers:
 *   get:
 *     summary: Get top customers
 *     description: Get list of top customers by rental activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top customers list
 */

/**
 * @swagger
 * /dashboard/recent-rentals:
 *   get:
 *     summary: Get recent rentals
 *     description: Get list of recent rentals with customer and vehicle details
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of rentals to retrieve (default 5)
 *     responses:
 *       200:
 *         description: Recent rentals list
 */

/**
 * @swagger
 * /dashboard/critical-alerts:
 *   get:
 *     summary: Get critical alerts
 *     description: Get only critical and high severity alerts
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Critical alerts list
 */

/**
 * @swagger
 * /dashboard/performance-data:
 *   get:
 *     summary: Get performance data
 *     description: Get revenue and occupancy data grouped by time period
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: Time period for grouping (default month)
 *     responses:
 *       200:
 *         description: Performance data
 */

/**
 * @swagger
 * /dashboard/maintenance-schedule:
 *   get:
 *     summary: Get maintenance schedule
 *     description: Get overdue and upcoming maintenance schedule
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance schedule
 */

// All routes require authentication
router.use(authMiddleware);

// Dashboard routes
router.get('/', dashboardController.getMain);
router.get('/kpis', dashboardController.getKPIs);
router.get('/alerts', dashboardController.getAlerts);
router.get('/vehicles-by-location', dashboardController.getVehiclesByLocation);
router.get('/occupancy-trend', dashboardController.getOccupancyTrend);
router.get('/top-customers', dashboardController.getTopCustomers);
router.get('/recent-rentals', dashboardController.getRecentRentals);
router.get('/critical-alerts', dashboardController.getCriticalAlerts);
router.get('/performance-data', dashboardController.getPerformanceData);
router.get('/maintenance-schedule', dashboardController.getMaintenanceSchedule);
router.get('/crm-summary', dashboardController.getCRMSummary);

export default router;
