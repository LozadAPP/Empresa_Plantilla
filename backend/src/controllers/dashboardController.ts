import { Response } from 'express';
import { Op, fn, col } from 'sequelize';
import dashboardService from '../services/dashboardService';
import Alert from '../models/Alert';
import Lead, { LeadStatus } from '../models/Lead';
import { AuthRequest } from '../types';
import logger from '../config/logger';


class DashboardController {
  /**
   * GET /dashboard
   * Get main dashboard data
   */
  async getMain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { location_id, start_date, end_date } = req.query;
      const locationId = location_id ? parseInt(location_id as string) : undefined;
      const startDate = start_date ? new Date(start_date as string) : undefined;
      const endDate = end_date ? new Date(end_date as string) : undefined;

      // For non-admin/director users, filter by their location
      const filterLocationId = req.user?.roles?.includes('admin') || req.user?.roles?.includes('director')
        ? locationId
        : req.user?.location_id || locationId;

      const [kpis, alerts, vehiclesByStatus, vehiclesByType] = await Promise.all([
        dashboardService.getKPIs({ location_id: filterLocationId, startDate, endDate }),
        dashboardService.getAlerts(filterLocationId),
        dashboardService.getVehiclesByStatus(filterLocationId),
        dashboardService.getVehiclesByType(filterLocationId)
      ]);

      res.status(200).json({
        success: true,
        data: {
          kpis,
          alerts,
          charts: {
            vehiclesByStatus,
            vehiclesByType
          }
        }
      });
    } catch (error: any) {
      logger.error('Get dashboard error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /dashboard/kpis
   * Get KPIs only
   */
  async getKPIs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { location_id } = req.query;
      const locationId = location_id ? parseInt(location_id as string) : undefined;

      const kpis = await dashboardService.getKPIs({ location_id: locationId });

      res.status(200).json({
        success: true,
        data: kpis
      });
    } catch (error: any) {
      logger.error('Get KPIs error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /dashboard/alerts
   * Get alerts only
   */
  async getAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { location_id } = req.query;
      const locationId = location_id ? parseInt(location_id as string) : undefined;

      const alerts = await dashboardService.getAlerts(locationId);

      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      logger.error('Get alerts error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /dashboard/vehicles-by-location
   * Get vehicle distribution by location
   */
  async getVehiclesByLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await dashboardService.getVehiclesByLocation();

      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Get vehicles by location error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /dashboard/occupancy-trend
   * Get occupancy trend
   */
  async getOccupancyTrend(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { location_id } = req.query;
      const locationId = location_id ? parseInt(location_id as string) : undefined;

      const trend = await dashboardService.getOccupancyTrend(locationId);

      res.status(200).json({
        success: true,
        data: trend
      });
    } catch (error: any) {
      logger.error('Get occupancy trend error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /dashboard/top-customers
   * Get top customers
   */
  async getTopCustomers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { limit = 5 } = req.query;
      const customers = await dashboardService.getTopCustomers(parseInt(limit as string));

      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      logger.error('Get top customers error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /dashboard/recent-rentals
   * Get recent rentals with customer and vehicle details
   */
  async getRecentRentals(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { limit = 5 } = req.query;
      const rentals = await dashboardService.getRecentRentals(parseInt(limit as string));

      res.status(200).json({
        success: true,
        data: rentals
      });
    } catch (error: any) {
      logger.error('Get recent rentals error', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener rentas recientes'
      });
    }
  }

  /**
   * GET /dashboard/critical-alerts
   * Get critical and warning alerts from the alerts table (generated by alertScheduler)
   */
  async getCriticalAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const dbAlerts = await Alert.findAll({
        where: {
          isResolved: false,
          severity: { [Op.in]: ['critical', 'warning'] }
        },
        order: [
          ['severity', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: 8
      });

      const formattedAlerts = dbAlerts.map((alert: any) => ({
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        alertType: alert.alertType,
        createdAt: alert.createdAt,
      }));

      res.status(200).json({
        success: true,
        data: formattedAlerts
      });
    } catch (error: any) {
      logger.error('Get critical alerts error', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener alertas críticas'
      });
    }
  }

  /**
   * GET /dashboard/performance-data
   * Get performance data (revenue and occupancy) grouped by time period
   */
  async getPerformanceData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period = 'month' } = req.query;
      const validPeriods = ['day', 'week', 'month', 'year'];
      const selectedPeriod = validPeriods.includes(period as string)
        ? (period as 'day' | 'week' | 'month' | 'year')
        : 'month';

      const performanceData = await dashboardService.getPerformanceData(selectedPeriod);

      res.status(200).json({
        success: true,
        data: performanceData
      });
    } catch (error: any) {
      logger.error('Get performance data error', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos de rendimiento'
      });
    }
  }

  /**
   * GET /dashboard/maintenance-schedule
   * Get maintenance schedule (overdue and upcoming)
   */
  async getMaintenanceSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const maintenanceData = await dashboardService.getMaintenanceSchedule();

      res.status(200).json({
        success: true,
        data: maintenanceData
      });
    } catch (error: any) {
      logger.error('Get maintenance schedule error', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener calendario de mantenimiento'
      });
    }
  }
  /**
   * GET /dashboard/crm-summary
   * Get CRM pipeline summary for dashboard widget
   */
  async getCRMSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Pipeline counts by status
      const pipelineCounts = await Lead.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      });

      const pipeline: Record<string, number> = {};
      for (const row of pipelineCounts as any[]) {
        pipeline[row.status] = parseInt(row.count);
      }

      // Total value of active pipeline (not won/lost)
      const activeStatuses = [
        LeadStatus.NEW,
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
        LeadStatus.PROPOSAL,
        LeadStatus.NEGOTIATION,
      ];
      const valueResult = await Lead.sum('estimatedValue', {
        where: { status: { [Op.in]: activeStatuses } },
      });
      const totalPipelineValue = valueResult || 0;

      // Conversion rate (won / (won + lost))
      const wonCount = pipeline[LeadStatus.WON] || 0;
      const lostCount = pipeline[LeadStatus.LOST] || 0;
      const conversionRate = (wonCount + lostCount) > 0
        ? Math.round((wonCount / (wonCount + lostCount)) * 100)
        : 0;

      // Follow-ups due today or overdue
      const followUpsDue = await Lead.count({
        where: {
          nextFollowUp: { [Op.lte]: now },
          status: { [Op.notIn]: [LeadStatus.WON, LeadStatus.LOST] },
        },
      });

      // Conversions in last 30 days
      const recentConversions = await Lead.count({
        where: {
          status: LeadStatus.WON,
          convertedAt: { [Op.gte]: thirtyDaysAgo },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          pipeline,
          totalPipelineValue,
          conversionRate,
          followUpsDue,
          recentConversions,
        },
      });
    } catch (error: any) {
      logger.error('Get CRM summary error', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen CRM',
      });
    }
  }
}

export default new DashboardController();
