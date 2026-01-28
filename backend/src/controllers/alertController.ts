import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Alert from '../models/Alert';
import User from '../models/User';
import { Op } from 'sequelize';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const {
      alertType,
      severity,
      isRead,
      isResolved,
      assignedTo,
      page = 1,
      limit = 50,
    } = req.query;

    const where: any = {};

    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';
    if (assignedTo) where.assignedTo = assignedTo;

    // Don't show expired alerts
    where[Op.or] = [
      { expiresAt: { [Op.is]: null } },
      { expiresAt: { [Op.gt]: new Date() } },
    ];

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Alert.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [
        ['severity', 'DESC'], // critical first
        ['isRead', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: 'Error interno del servidor',
    });
  }
};

export const getAlertById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    const alert = await Alert.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert',
      error: 'Error interno del servidor',
    });
  }
};

export const createAlert = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const {
      alertType,
      severity,
      title,
      message,
      entityType,
      entityId,
      assignedTo,
      expiresAt,
      metadata,
    } = req.body;

    const alert = await Alert.create({
      alertType,
      severity: severity || 'info',
      title,
      message,
      entityType,
      entityId,
      assignedTo,
      expiresAt,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      isRead: false,
      isResolved: false,
    });

    const alertWithDetails = await Alert.findByPk(alert.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alertWithDetails,
    });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating alert',
      error: 'Error interno del servidor',
    });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    const alert = await Alert.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    await alert.update({ isRead: true });

    res.json({
      success: true,
      message: 'Alert marked as read',
      data: alert,
    });
  } catch (error: any) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking alert as read',
      error: 'Error interno del servidor',
    });
  }
};

export const markAsUnread = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    const alert = await Alert.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    await alert.update({ isRead: false });

    res.json({
      success: true,
      message: 'Alert marked as unread',
      data: alert,
    });
  } catch (error: any) {
    console.error('Error marking alert as unread:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking alert as unread',
      error: 'Error interno del servidor',
    });
  }
};

export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = (req as any).user.id;

    const alert = await Alert.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    await alert.update({
      isResolved: true,
      resolvedBy: userId,
      resolvedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert,
    });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: 'Error interno del servidor',
    });
  }
};

export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    const alert = await Alert.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    await alert.destroy();

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting alert',
      error: 'Error interno del servidor',
    });
  }
};

export const getAlertTrends = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const numDays = Math.min(Number(days), 30); // Max 30 days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays + 1);
    startDate.setHours(0, 0, 0, 0);

    // Get alerts created in the date range grouped by date and severity
    const alerts = await Alert.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      attributes: [
        [Alert.sequelize!.fn('DATE', Alert.sequelize!.col('created_at')), 'date'],
        'severity',
        [Alert.sequelize!.fn('COUNT', Alert.sequelize!.col('id')), 'count'],
      ],
      group: [Alert.sequelize!.fn('DATE', Alert.sequelize!.col('created_at')), 'severity'],
      order: [[Alert.sequelize!.fn('DATE', Alert.sequelize!.col('created_at')), 'ASC']],
      raw: true,
    });

    // Generate all dates in range
    const dateRange: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize data structure
    const trendData: { [date: string]: { critical: number; warning: number; info: number; total: number } } = {};
    dateRange.forEach(date => {
      trendData[date] = { critical: 0, warning: 0, info: 0, total: 0 };
    });

    // Fill in actual data
    (alerts as any[]).forEach(row => {
      const date = row.date;
      const severity = row.severity as string;
      const count = Number(row.count);
      if (trendData[date]) {
        trendData[date][severity as 'critical' | 'warning' | 'info'] = count;
        trendData[date].total += count;
      }
    });

    // Convert to array format for charts
    const labels = dateRange;
    const critical = dateRange.map(date => trendData[date].critical);
    const warning = dateRange.map(date => trendData[date].warning);
    const info = dateRange.map(date => trendData[date].info);
    const total = dateRange.map(date => trendData[date].total);

    res.json({
      success: true,
      data: {
        labels,
        datasets: {
          critical,
          warning,
          info,
          total,
        },
        raw: trendData,
      },
    });
  } catch (error: any) {
    console.error('Error fetching alert trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert trends',
      error: 'Error interno del servidor',
    });
  }
};

export const getAlertStats = async (req: Request, res: Response) => {
  try {
    // Common condition for non-expired alerts
    const notExpiredCondition = {
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } },
      ],
    } as any;

    const total = await Alert.count({
      where: notExpiredCondition,
    });

    const unread = await Alert.count({
      where: {
        isRead: false,
        ...notExpiredCondition,
      } as any,
    });

    const unresolved = await Alert.count({
      where: {
        isResolved: false,
        ...notExpiredCondition,
      } as any,
    });

    const critical = await Alert.count({
      where: {
        severity: 'critical',
        isResolved: false,
        ...notExpiredCondition,
      } as any,
    });

    const bySeverity = await Alert.findAll({
      where: {
        isResolved: false,
        ...notExpiredCondition,
      } as any,
      attributes: [
        'severity',
        [Alert.sequelize!.fn('COUNT', Alert.sequelize!.col('id')), 'count'],
      ],
      group: ['severity'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        total,
        unread,
        unresolved,
        critical,
        bySeverity,
      },
    });
  } catch (error: any) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert stats',
      error: 'Error interno del servidor',
    });
  }
};
