import { Op, fn, col, literal } from 'sequelize';
import { Vehicle, Customer, Location, VehicleType, Rental, Payment } from '../models';

interface DashboardFilters {
  location_id?: number;
  startDate?: Date;
  endDate?: Date;
}

class DashboardService {
  /**
   * Get main KPIs for dashboard
   */
  async getKPIs(filters: DashboardFilters) {
    const where: any = {};
    if (filters.location_id) {
      where.location_id = filters.location_id;
    }

    // Vehicle statistics
    const [available, rented, maintenance, totalVehicles] = await Promise.all([
      Vehicle.count({ where: { ...where, status: 'available' } }),
      Vehicle.count({ where: { ...where, status: 'rented' } }),
      Vehicle.count({ where: { ...where, status: 'maintenance' } }),
      Vehicle.count({ where })
    ]);

    // Customer statistics
    const [totalCustomers, activeCustomers] = await Promise.all([
      Customer.count(),
      Customer.count({ where: { is_active: true } })
    ]);

    // Calculate occupancy rate
    const occupancyRate = totalVehicles > 0
      ? ((rented / totalVehicles) * 100).toFixed(1)
      : 0;

    // Financial statistics with date filters
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Use custom date range if provided, otherwise use defaults
    const dateRangeStart = filters.startDate || startOfMonth;
    const dateRangeEnd = filters.endDate || endOfMonth;

    // Today's income from payments
    const todayPayments = await Payment.sum('amount', {
      where: {
        transaction_date: {
          [Op.gte]: startOfToday
        },
        status: 'completed'
      }
    });

    // Period income (month by default, or custom range)
    const periodPayments = await Payment.sum('amount', {
      where: {
        transaction_date: {
          [Op.between]: [dateRangeStart, dateRangeEnd]
        },
        status: 'completed'
      }
    });

    // Pending payments (from active rentals)
    const activeRentals = await Rental.findAll({
      where: {
        status: {
          [Op.in]: ['active', 'reserved']
        }
      },
      attributes: ['total_amount', 'deposit_amount']
    });

    const pendingPayments = activeRentals.reduce((sum: number, rental: any) => {
      return sum + (Number.parseFloat(rental.total_amount) || 0) - (Number.parseFloat(rental.deposit_amount) || 0);
    }, 0);

    return {
      vehicles: {
        available,
        rented,
        maintenance,
        total: totalVehicles,
        occupancyRate: parseFloat(occupancyRate as string)
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers
      },
      financial: {
        todayIncome: todayPayments || 0,
        monthIncome: periodPayments || 0,
        pendingPayments: pendingPayments || 0
      }
    };
  }

  /**
   * Get vehicle distribution by status
   */
  async getVehiclesByStatus(location_id?: number) {
    const where: any = {};
    if (location_id) where.location_id = location_id;

    const vehicles = await Vehicle.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    return vehicles.map((v: any) => ({
      status: v.status,
      count: parseInt(v.getDataValue('count'))
    }));
  }

  /**
   * Get vehicle distribution by type
   */
  async getVehiclesByType(location_id?: number) {
    const include: any[] = [{
      model: VehicleType,
      as: 'vehicleType',
      attributes: ['name']
    }];

    const where: any = {};
    if (location_id) where.location_id = location_id;

    const vehicles = await Vehicle.findAll({
      where,
      include,
      attributes: [
        'vehicle_type_id',
        [fn('COUNT', col('Vehicle.id')), 'count']
      ],
      group: ['vehicle_type_id', 'vehicleType.id', 'vehicleType.name']
    });

    return vehicles.map((v: any) => ({
      type: v.vehicleType?.name || 'Unknown',
      count: parseInt(v.getDataValue('count'))
    }));
  }

  /**
   * Get vehicle distribution by location
   */
  async getVehiclesByLocation() {
    const vehicles = await Vehicle.findAll({
      include: [{
        model: Location,
        as: 'location',
        attributes: ['name', 'city']
      }],
      attributes: [
        'location_id',
        'status',
        [fn('COUNT', col('Vehicle.id')), 'count']
      ],
      group: ['location_id', 'status', 'location.id', 'location.name', 'location.city']
    });

    // Group by location
    const locationMap = new Map();

    vehicles.forEach((v: any) => {
      const locationName = v.location?.name || 'Unknown';
      if (!locationMap.has(locationName)) {
        locationMap.set(locationName, {
          location: locationName,
          city: v.location?.city || '',
          available: 0,
          rented: 0,
          maintenance: 0,
          total: 0
        });
      }

      const count = parseInt(v.getDataValue('count'));
      const loc = locationMap.get(locationName);
      loc[v.status] = count;
      loc.total += count;
    });

    return Array.from(locationMap.values());
  }

  /**
   * Get alerts for dashboard
   */
  async getAlerts(location_id?: number) {
    const alerts: any[] = [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const where: any = {};
    if (location_id) where.location_id = location_id;

    // Vehicles with expiring insurance
    const expiringInsurance = await Vehicle.findAll({
      where: {
        ...where,
        insurance_expiry: {
          [Op.between]: [now, sevenDaysFromNow]
        }
      },
      attributes: ['id', 'make', 'model', 'license_plate', 'insurance_expiry']
    });

    expiringInsurance.forEach((v: any) => {
      alerts.push({
        id: `insurance-${v.id}`,
        severity: 'urgent',
        title: 'Insurance Expiring Soon',
        description: `${v.make} ${v.model} (${v.license_plate}) insurance expires on ${v.insurance_expiry.toLocaleDateString()}`,
        entityType: 'vehicle',
        entityId: v.id,
        timestamp: now
      });
    });

    // Vehicles with upcoming maintenance
    const upcomingMaintenance = await Vehicle.findAll({
      where: {
        ...where,
        next_maintenance: {
          [Op.between]: [now, sevenDaysFromNow]
        },
        status: { [Op.ne]: 'maintenance' }
      },
      attributes: ['id', 'make', 'model', 'license_plate', 'next_maintenance']
    });

    upcomingMaintenance.forEach((v: any) => {
      alerts.push({
        id: `maintenance-${v.id}`,
        severity: 'warning',
        title: 'Maintenance Due Soon',
        description: `${v.make} ${v.model} (${v.license_plate}) maintenance due on ${v.next_maintenance.toLocaleDateString()}`,
        entityType: 'vehicle',
        entityId: v.id,
        timestamp: now
      });
    });

    // Vehicles in poor condition
    const poorCondition = await Vehicle.findAll({
      where: {
        ...where,
        condition: 'poor',
        status: { [Op.ne]: 'maintenance' }
      },
      attributes: ['id', 'make', 'model', 'license_plate']
    });

    poorCondition.forEach((v: any) => {
      alerts.push({
        id: `condition-${v.id}`,
        severity: 'critical',
        title: 'Vehicle in Poor Condition',
        description: `${v.make} ${v.model} (${v.license_plate}) needs attention`,
        entityType: 'vehicle',
        entityId: v.id,
        timestamp: now
      });
    });

    // Sort by severity
    const severityOrder: Record<string, number> = { critical: 0, urgent: 1, warning: 2, info: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
  }

  /**
   * Get occupancy trend (last 30 days simulation)
   */
  async getOccupancyTrend(location_id?: number) {
    // This is a simplified version - in production, you'd query actual rental data
    const where: any = {};
    if (location_id) where.location_id = location_id;

    const totalVehicles = await Vehicle.count({ where });
    const rentedNow = await Vehicle.count({ where: { ...where, status: 'rented' } });

    // Generate trend data for last 30 days (simulated)
    const trend = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simulate some variance
      const variance = Math.random() * 0.2 - 0.1; // -10% to +10%
      const baseRate = (rentedNow / totalVehicles) || 0.5;
      const rate = Math.max(0, Math.min(1, baseRate + variance));

      trend.push({
        date: date.toISOString().split('T')[0],
        occupancyRate: (rate * 100).toFixed(1),
        rented: Math.round(totalVehicles * rate),
        available: totalVehicles - Math.round(totalVehicles * rate)
      });
    }

    return trend;
  }

  /**
   * Get recent rentals
   */
  async getRecentRentals(limit: number = 5) {
    const rentals = await Rental.findAll({
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'contact_person']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['make', 'model', 'license_plate']
        }
      ],
      attributes: ['id', 'start_date', 'end_date', 'total_amount', 'status', 'created_at']
    });

    return rentals.map((r: any) => ({
      id: r.id,
      customerName: r.customer?.name || 'N/A',
      customerContact: r.customer?.contact_person || '',
      vehicleName: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A',
      vehiclePlate: r.vehicle?.license_plate || '',
      startDate: r.start_date,
      endDate: r.end_date,
      totalAmount: r.total_amount,
      status: r.status,
      createdAt: r.created_at
    }));
  }

  /**
   * Get top customers by revenue and rental count
   */
  async getTopCustomers(limit: number = 5) {
    // Query with proper aggregations
    const customers = await Customer.findAll({
      where: { is_active: true },
      include: [
        {
          model: Rental,
          as: 'rentals',
          attributes: [],
          required: false
        },
        {
          model: Payment,
          as: 'payments',
          attributes: [],
          where: { status: 'completed' },
          required: false
        }
      ],
      attributes: [
        'id',
        'name',
        'contact_person',
        [fn('COUNT', literal('DISTINCT rentals.id')), 'rentalCount'],
        [fn('COALESCE', fn('SUM', col('payments.amount')), 0), 'totalRevenue']
      ],
      group: ['Customer.id', 'Customer.name', 'Customer.contact_person'],
      order: [[literal('"totalRevenue"'), 'DESC']],
      limit,
      subQuery: false
    });

    return customers.map((c: any) => ({
      id: c.id,
      name: c.name,
      contactPerson: c.contact_person,
      totalRentals: parseInt(c.getDataValue('rentalCount') || 0),
      totalRevenue: parseFloat(c.getDataValue('totalRevenue') || 0),
      trend: 'up' // Could calculate trend by comparing with previous period
    }));
  }

  /**
   * Get performance data by period
   */
  async getPerformanceData(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    let interval: string;
    let groupFormat: string;
    let dateRange: Date;
    const now = new Date();

    switch (period) {
      case 'day':
        interval = '1 hour';
        groupFormat = 'YYYY-MM-DD HH24';
        dateRange = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        interval = '1 day';
        groupFormat = 'YYYY-MM-DD';
        dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        interval = '1 day';
        groupFormat = 'YYYY-MM-DD';
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        interval = '1 month';
        groupFormat = 'YYYY-MM';
        dateRange = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        interval = '1 day';
        groupFormat = 'YYYY-MM-DD';
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Create the time bucket expression for grouping
    const timeBucketExpr = fn('TO_CHAR', col('transaction_date'), groupFormat);
    const timeBucketExprRental = fn('TO_CHAR', col('start_date'), groupFormat);

    // Get revenue data
    const revenueData = await Payment.findAll({
      where: {
        transaction_date: { [Op.gte]: dateRange },
        status: 'completed'
      },
      attributes: [
        [timeBucketExpr, 'timeBucket'],
        [fn('SUM', col('amount')), 'revenue']
      ],
      group: [timeBucketExpr],
      order: [[timeBucketExpr, 'ASC']],
      raw: true
    });

    // Get occupancy data
    const totalVehicles = await Vehicle.count();
    const occupancyData = await Rental.findAll({
      where: {
        start_date: { [Op.gte]: dateRange }
      },
      attributes: [
        [timeBucketExprRental, 'timeBucket'],
        [fn('COUNT', fn('DISTINCT', col('vehicle_id'))), 'rentedCount']
      ],
      group: [timeBucketExprRental],
      order: [[timeBucketExprRental, 'ASC']],
      raw: true
    });

    // Merge data
    const dataMap = new Map();

    (revenueData as any[]).forEach((item: any) => {
      dataMap.set(item.timeBucket, {
        timeBucket: item.timeBucket,
        revenue: parseFloat(item.revenue) || 0,
        occupancy: 0
      });
    });

    (occupancyData as any[]).forEach((item: any) => {
      const existing = dataMap.get(item.timeBucket) || { timeBucket: item.timeBucket, revenue: 0, occupancy: 0 };
      existing.occupancy = totalVehicles > 0
        ? ((parseInt(item.rentedCount) / totalVehicles) * 100).toFixed(1)
        : 0;
      dataMap.set(item.timeBucket, existing);
    });

    return Array.from(dataMap.values());
  }

  /**
   * Get maintenance schedule (overdue and upcoming)
   */
  async getMaintenanceSchedule() {
    const now = new Date();
    const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    // Overdue maintenance (vehicles with next_maintenance in the past)
    const overdue = await Vehicle.findAll({
      where: {
        next_maintenance: {
          [Op.lt]: now,
          [Op.ne]: null as any
        },
        status: { [Op.ne]: 'maintenance' }
      } as any,
      attributes: ['id', 'make', 'model', 'license_plate', 'next_maintenance'],
      order: [['next_maintenance', 'ASC']]
    });

    // Upcoming maintenance (next 15 days)
    const upcoming = await Vehicle.findAll({
      where: {
        next_maintenance: {
          [Op.gte]: now,
          [Op.lte]: fifteenDaysFromNow
        },
        status: { [Op.ne]: 'maintenance' }
      },
      attributes: ['id', 'make', 'model', 'license_plate', 'next_maintenance'],
      order: [['next_maintenance', 'ASC']]
    });

    return {
      overdue: overdue.map((v: any) => ({
        id: v.id,
        vehicleName: `${v.make} ${v.model}`,
        licensePlate: v.license_plate,
        scheduledDate: v.next_maintenance,
        daysOverdue: Math.floor((now.getTime() - new Date(v.next_maintenance).getTime()) / (1000 * 60 * 60 * 24))
      })),
      upcoming: upcoming.map((v: any) => ({
        id: v.id,
        vehicleName: `${v.make} ${v.model}`,
        licensePlate: v.license_plate,
        scheduledDate: v.next_maintenance,
        daysUntil: Math.floor((new Date(v.next_maintenance).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }))
    };
  }
}

export default new DashboardService();
