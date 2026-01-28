import { Request, Response } from 'express';
import { Op } from 'sequelize';
import AuditLog from '../models/AuditLog';
import User from '../models/User';

// ====================================
// GET ALL AUDIT LOGS
// ====================================

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      search,
      action,
      entityType,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    const where: any = {};

    // Action filter
    if (action && action !== 'all') {
      where.action = (action as string).toLowerCase();
    }

    // Entity type filter
    if (entityType && entityType !== 'all') {
      where.entity_type = entityType;
    }

    // User ID filter
    if (userId) {
      where.user_id = Number(userId);
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp[Op.gte] = new Date(dateFrom as string);
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        where.timestamp[Op.lte] = endDate;
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: logs, count: total } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: Number(limit),
      offset
    });

    // Transform logs to match frontend expected format
    const transformedLogs = logs.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Sistema',
      action: log.action.toUpperCase(),
      entityType: log.entity_type,
      entityId: log.entity_id,
      oldValues: log.old_values,
      newValues: log.new_values,
      ipAddress: log.ip_address,
      createdAt: log.timestamp
    }));

    // Apply search filter after transformation (on userName, entityType, action)
    let filteredLogs = transformedLogs;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredLogs = transformedLogs.filter((log: any) =>
        log.userName.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: filteredLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs'
    });
  }
};

// ====================================
// GET AUDIT LOG BY ID
// ====================================

export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    const logData: any = log;
    const transformedLog = {
      id: logData.id,
      userId: logData.user_id,
      userName: logData.user ? `${logData.user.first_name} ${logData.user.last_name}` : 'Sistema',
      action: logData.action.toUpperCase(),
      entityType: logData.entity_type,
      entityId: logData.entity_id,
      oldValues: logData.old_values,
      newValues: logData.new_values,
      ipAddress: logData.ip_address,
      createdAt: logData.timestamp
    };

    res.json({
      success: true,
      data: transformedLog
    });
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log'
    });
  }
};

// ====================================
// GET AUDIT STATS
// ====================================

export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const total = await AuditLog.count();

    // Today's actions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await AuditLog.count({
      where: {
        timestamp: {
          [Op.gte]: today
        }
      }
    });

    // Actions by type
    const createCount = await AuditLog.count({ where: { action: 'create' } });
    const updateCount = await AuditLog.count({ where: { action: 'update' } });
    const deleteCount = await AuditLog.count({ where: { action: 'delete' } });

    // This week's actions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekCount = await AuditLog.count({
      where: {
        timestamp: {
          [Op.gte]: weekStart
        }
      }
    });

    res.json({
      success: true,
      data: {
        total,
        today: todayCount,
        thisWeek: weekCount,
        byAction: {
          create: createCount,
          update: updateCount,
          delete: deleteCount
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit stats'
    });
  }
};

// ====================================
// GET AUDIT LOGS BY USER
// ====================================

export const getAuditLogsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: logs, count: total } = await AuditLog.findAndCountAll({
      where: { user_id: Number(userId) },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: Number(limit),
      offset
    });

    const transformedLogs = logs.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Sistema',
      action: log.action.toUpperCase(),
      entityType: log.entity_type,
      entityId: log.entity_id,
      oldValues: log.old_values,
      newValues: log.new_values,
      ipAddress: log.ip_address,
      createdAt: log.timestamp
    }));

    res.json({
      success: true,
      data: transformedLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user audit logs'
    });
  }
};

// ====================================
// GET ENTITY TYPES
// ====================================

export const getEntityTypes = async (req: Request, res: Response) => {
  try {
    const entityTypes = await AuditLog.findAll({
      attributes: ['entity_type'],
      group: ['entity_type'],
      raw: true
    });

    const types = entityTypes.map((item: any) => item.entity_type);

    res.json({
      success: true,
      data: types
    });
  } catch (error: any) {
    console.error('Error fetching entity types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching entity types'
    });
  }
};

export default {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getAuditLogsByUser,
  getEntityTypes
};
