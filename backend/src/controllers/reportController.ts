import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import Rental from '../models/Rental';
import Vehicle from '../models/Vehicle';
import Customer from '../models/Customer';
import Transaction from '../models/Transaction';
import MaintenanceOrder from '../models/MaintenanceOrder';
import Location from '../models/Location';
import sequelize from '../config/database';

// ====================================
// INCOME REPORTS
// ====================================

export const getIncomeReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, locationId, groupBy = 'day' } = req.query;

    const where: any = {
      status: { [Op.in]: ['active', 'completed'] },
    };

    if (startDate || endDate) {
      where.start_date = {};
      if (startDate) where.start_date[Op.gte] = new Date(startDate as string);
      if (endDate) where.start_date[Op.lte] = new Date(endDate as string);
    }

    if (locationId) {
      where['$vehicle.location_id$'] = locationId;
    }

    const rentals = await Rental.findAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate'],
          include: [
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name', 'city'],
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name'],
        },
      ],
      order: [['start_date', 'DESC']],
    });

    const totalIncome = rentals.reduce((sum, rental) => sum + Number(rental.total_amount || 0), 0);
    const totalRentals = rentals.length;
    const averageIncome = totalRentals > 0 ? totalIncome / totalRentals : 0;

    // Group by period
    const groupedData: any = {};
    rentals.forEach((rental) => {
      let key: string;
      const date = new Date(rental.start_date);

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.getFullYear().toString();
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          totalIncome: 0,
          rentalCount: 0,
        };
      }

      groupedData[key].totalIncome += Number(rental.total_amount || 0);
      groupedData[key].rentalCount += 1;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalRentals,
          averageIncome,
        },
        details: rentals,
        grouped: Object.values(groupedData),
      },
    });
  } catch (error: any) {
    console.error('Error generating income report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating income report',
    });
  }
};

// ====================================
// OCCUPANCY REPORTS
// ====================================

export const getOccupancyReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    // Get all vehicles
    const vehicleWhere: any = {};
    if (locationId) vehicleWhere.location_id = locationId;

    const totalVehicles = await Vehicle.count({ where: vehicleWhere });

    // Get rented vehicles in period
    const rentalWhere: any = {
      status: { [Op.in]: ['active', 'completed'] },
    };

    if (startDate || endDate) {
      rentalWhere[Op.or] = [
        {
          start_date: {
            [Op.between]: [
              startDate ? new Date(startDate as string) : new Date('2000-01-01'),
              endDate ? new Date(endDate as string) : new Date('2100-01-01'),
            ],
          },
        },
        {
          end_date: {
            [Op.between]: [
              startDate ? new Date(startDate as string) : new Date('2000-01-01'),
              endDate ? new Date(endDate as string) : new Date('2100-01-01'),
            ],
          },
        },
      ];
    }

    if (locationId) {
      rentalWhere['$vehicle.location_id$'] = locationId;
    }

    const rentals = await Rental.findAll({
      where: rentalWhere,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate', 'location_id'],
        },
      ],
    });

    const uniqueVehiclesRented = new Set(rentals.map((r) => r.vehicle_id)).size;
    const occupancyRate = totalVehicles > 0 ? (uniqueVehiclesRented / totalVehicles) * 100 : 0;

    // Get current status
    const available = await Vehicle.count({
      where: { ...vehicleWhere, status: 'available' },
    });
    const rented = await Vehicle.count({
      where: { ...vehicleWhere, status: 'rented' },
    });
    const maintenance = await Vehicle.count({
      where: { ...vehicleWhere, status: 'maintenance' },
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalVehicles,
          available,
          rented,
          maintenance,
          occupancyRate: occupancyRate.toFixed(2),
        },
        rentals,
      },
    });
  } catch (error: any) {
    console.error('Error generating occupancy report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating occupancy report',
    });
  }
};

// ====================================
// PROFITABILITY REPORTS
// ====================================

export const getProfitabilityReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, vehicleId } = req.query;

    const rentalWhere: any = {
      status: { [Op.in]: ['active', 'completed'] },
    };

    if (startDate || endDate) {
      rentalWhere.start_date = {};
      if (startDate) rentalWhere.start_date[Op.gte] = new Date(startDate as string);
      if (endDate) rentalWhere.start_date[Op.lte] = new Date(endDate as string);
    }

    if (vehicleId) rentalWhere.vehicle_id = vehicleId;

    // Get rental income
    const rentals = await Rental.findAll({
      where: rentalWhere,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate', 'purchase_price'],
        },
      ],
    });

    const totalRevenue = rentals.reduce((sum, rental) => sum + Number(rental.total_amount || 0), 0);

    // Get maintenance costs
    const maintenanceWhere: any = {
      status: 'completed',
    };

    if (startDate || endDate) {
      maintenanceWhere.completed_date = {};
      if (startDate) maintenanceWhere.completed_date[Op.gte] = new Date(startDate as string);
      if (endDate) maintenanceWhere.completed_date[Op.lte] = new Date(endDate as string);
    }

    if (vehicleId) maintenanceWhere.vehicle_id = vehicleId;

    const maintenanceOrders = await MaintenanceOrder.findAll({
      where: maintenanceWhere,
      attributes: ['vehicle_id', [fn('SUM', col('actual_cost')), 'totalCost']],
      group: ['vehicle_id'],
      raw: true,
    });

    const totalMaintenanceCost = maintenanceOrders.reduce(
      (sum: number, order: any) => sum + Number(order.totalCost || 0),
      0
    );

    // Get other expenses from transactions
    const expenseWhere: any = {
      transactionType: 'expense',
      status: 'completed',
    };

    if (startDate || endDate) {
      expenseWhere.transactionDate = {};
      if (startDate) expenseWhere.transactionDate[Op.gte] = new Date(startDate as string);
      if (endDate) expenseWhere.transactionDate[Op.lte] = new Date(endDate as string);
    }

    const expenses = await Transaction.findAll({
      where: expenseWhere,
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const totalCosts = totalMaintenanceCost + totalExpenses;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalMaintenanceCost,
          totalExpenses,
          totalCosts,
          netProfit,
          profitMargin: profitMargin.toFixed(2),
        },
        breakdown: {
          rentals: rentals.length,
          maintenanceOrders: maintenanceOrders.length,
          otherExpenses: expenses.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating profitability report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating profitability report',
    });
  }
};

// ====================================
// TOP CUSTOMERS REPORT
// ====================================

export const getTopCustomersReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const where: any = {
      status: { [Op.in]: ['active', 'completed'] },
    };

    if (startDate || endDate) {
      where.start_date = {};
      if (startDate) where.start_date[Op.gte] = new Date(startDate as string);
      if (endDate) where.start_date[Op.lte] = new Date(endDate as string);
    }

    const topCustomers = await Rental.findAll({
      where,
      attributes: [
        'customer_id',
        [fn('COUNT', col('id')), 'rentalCount'],
        [fn('SUM', col('total_amount')), 'totalRevenue'],
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone', 'customer_type'],
        },
      ],
      group: ['customer_id', 'customer.id'],
      order: [[literal('"totalRevenue"'), 'DESC']],
      limit: Number(limit),
      raw: false,
    });

    res.json({
      success: true,
      data: topCustomers,
    });
  } catch (error: any) {
    console.error('Error generating top customers report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating top customers report',
    });
  }
};

// ====================================
// VEHICLE PERFORMANCE REPORT
// ====================================

export const getVehiclePerformanceReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const rentalWhere: any = {
      status: { [Op.in]: ['active', 'completed'] },
    };

    if (startDate || endDate) {
      rentalWhere.start_date = {};
      if (startDate) rentalWhere.start_date[Op.gte] = new Date(startDate as string);
      if (endDate) rentalWhere.start_date[Op.lte] = new Date(endDate as string);
    }

    if (locationId) {
      rentalWhere['$vehicle.location_id$'] = locationId;
    }

    const vehiclePerformance = await Rental.findAll({
      where: rentalWhere,
      attributes: [
        'vehicle_id',
        [fn('COUNT', col('Rental.id')), 'rentalCount'],
        [fn('SUM', col('total_amount')), 'totalRevenue'],
        [fn('AVG', col('total_amount')), 'averageRevenue'],
      ],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate', 'year', 'status'],
        },
      ],
      group: ['vehicle_id', 'vehicle.id'],
      order: [[literal('"totalRevenue"'), 'DESC']],
      raw: false,
    });

    res.json({
      success: true,
      data: vehiclePerformance,
    });
  } catch (error: any) {
    console.error('Error generating vehicle performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating vehicle performance report',
    });
  }
};

// ====================================
// DASHBOARD SUMMARY
// ====================================

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Vehicle stats
    const vehicleWhere: any = {};
    if (locationId) vehicleWhere.location_id = locationId;

    const totalVehicles = await Vehicle.count({ where: vehicleWhere });
    const availableVehicles = await Vehicle.count({
      where: { ...vehicleWhere, status: 'available' },
    });
    const rentedVehicles = await Vehicle.count({
      where: { ...vehicleWhere, status: 'rented' },
    });
    const maintenanceVehicles = await Vehicle.count({
      where: { ...vehicleWhere, status: 'maintenance' },
    });

    // Rental stats
    const activeRentals = await Rental.count({
      where: { status: 'active' },
    });

    // Today's income
    const todayRentals = await Rental.findAll({
      where: {
        start_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });
    const todayIncome = todayRentals.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    // Pending alerts
    const Alert = (await import('../models/Alert')).default;
    const criticalAlerts = await Alert.count({
      where: {
        severity: 'critical',
        isResolved: false,
      },
    });

    res.json({
      success: true,
      data: {
        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          rented: rentedVehicles,
          maintenance: maintenanceVehicles,
        },
        rentals: {
          active: activeRentals,
        },
        today: {
          income: todayIncome,
          rentals: todayRentals.length,
        },
        alerts: {
          critical: criticalAlerts,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating dashboard summary',
    });
  }
};
