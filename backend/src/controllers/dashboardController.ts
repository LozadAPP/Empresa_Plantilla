import { Response } from 'express';
import { Op } from 'sequelize';
import dashboardService from '../services/dashboardService';
import Alert from '../models/Alert';
import { AuthRequest } from '../types';


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
      console.error('Get dashboard error:', error);
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
      console.error('Get KPIs error:', error);
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
      console.error('Get alerts error:', error);
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
      console.error('Get vehicles by location error:', error);
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
      console.error('Get occupancy trend error:', error);
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
      console.error('Get top customers error:', error);
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
      console.error('Get recent rentals error:', error);
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
      console.error('Get critical alerts error:', error);
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
      console.error('Get performance data error:', error);
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
      console.error('Get maintenance schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener calendario de mantenimiento'
      });
    }
  }
}

export default new DashboardController();
