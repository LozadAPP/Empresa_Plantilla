import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import MaintenanceOrder from '../models/MaintenanceOrder';
import MaintenanceType from '../models/MaintenanceType';
import Vehicle from '../models/Vehicle';
import User from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { createAuditLog, getClientIp } from '../utils/auditLogger';
import logger from '../config/logger';
import { AuthRequest } from '../types';

// ====================================
// MAINTENANCE TYPES
// ====================================

export const getMaintenanceTypes = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const types = await MaintenanceType.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: types,
    });
  } catch (error: any) {
    logger.error('Error fetching maintenance types', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance types',
      error: 'Error interno del servidor',
    });
  }
};

export const createMaintenanceType = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { name, description, estimatedCost, estimatedDuration } = req.body;

    const type = await MaintenanceType.create({
      name,
      description,
      estimatedCost,
      estimatedDuration,
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance type created successfully',
      data: type,
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un tipo de mantenimiento con ese nombre',
      });
    }
    logger.error('Error creating maintenance type', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating maintenance type',
      error: 'Error interno del servidor',
    });
  }
};

export const updateMaintenanceType = async (req: Request, res: Response) => {
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

    // Whitelist of allowed fields for update
    const allowedFields = ['name', 'description', 'estimatedCost', 'estimatedDuration', 'isActive'];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const type = await MaintenanceType.findByPk(id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance type not found',
      });
    }

    await type.update(updates);

    res.json({
      success: true,
      message: 'Maintenance type updated successfully',
      data: type,
    });
  } catch (error: any) {
    logger.error('Error updating maintenance type', { error });
    res.status(500).json({
      success: false,
      message: 'Error updating maintenance type',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// MAINTENANCE ORDERS
// ====================================

export const getMaintenanceOrders = async (req: Request, res: Response) => {
  try {
    const { status, priority, vehicleId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (vehicleId) where.vehicleId = vehicleId;

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate[Op.gte] = new Date(startDate as string);
      if (endDate) where.scheduledDate[Op.lte] = new Date(endDate as string);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await MaintenanceOrder.findAndCountAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate', 'year'],
        },
        {
          model: MaintenanceType,
          as: 'maintenanceType',
          attributes: ['id', 'name', 'estimatedCost', 'estimatedDuration'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['scheduledDate', 'DESC']],
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
    logger.error('Error fetching maintenance orders', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance orders',
      error: 'Error interno del servidor',
    });
  }
};

export const getMaintenanceOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await MaintenanceOrder.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
        },
        {
          model: MaintenanceType,
          as: 'maintenanceType',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Error fetching maintenance order', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance order',
      error: 'Error interno del servidor',
    });
  }
};

export const createMaintenanceOrder = async (req: AuthRequest, res: Response) => {
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
      vehicleId,
      maintenanceTypeId,
      scheduledDate,
      priority,
      description,
      workshopName,
      technicianName,
    } = req.body;

    const userId = req.user!.id;

    // Validate FK references exist
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    if (maintenanceTypeId) {
      const type = await MaintenanceType.findByPk(maintenanceTypeId);
      if (!type) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de mantenimiento no encontrado',
        });
      }
    }

    // Generate unique maintenance code using timestamp to avoid race conditions
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timeComponent = String(now.getTime()).slice(-6); // Last 6 digits of timestamp
    const randomComponent = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const maintenanceCode = `MNT-${year}${month}${day}-${timeComponent}${randomComponent}`;

    const order = await MaintenanceOrder.create({
      maintenanceCode,
      vehicleId,
      maintenanceTypeId,
      scheduledDate,
      priority: priority || 'medium',
      status: 'scheduled',
      description,
      workshopName,
      technicianName,
      createdBy: userId,
    });

    const orderWithDetails = await MaintenanceOrder.findByPk(order.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
        },
        {
          model: MaintenanceType,
          as: 'maintenanceType',
        },
      ],
    });

    // Audit log
    createAuditLog({
      userId: userId,
      entityType: 'maintenance_order',
      entityId: order.id,
      action: 'create',
      newValues: { maintenanceCode, vehicleId, maintenanceTypeId, priority, scheduledDate },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance order created successfully',
      data: orderWithDetails,
    });
  } catch (error: any) {
    logger.error('Error creating maintenance order', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating maintenance order',
      error: 'Error interno del servidor',
    });
  }
};

export const updateMaintenanceOrder = async (req: AuthRequest, res: Response) => {
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

    // Whitelist of allowed fields for update
    const allowedFields = [
      'vehicleId', 'maintenanceTypeId', 'scheduledDate', 'priority',
      'status', 'description', 'workshopName', 'technicianName'
    ];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const order = await MaintenanceOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance order not found',
      });
    }

    // Validate status transitions
    if (updates.status) {
      const validTransitions: Record<string, string[]> = {
        scheduled: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };

      const currentStatus = order.status;
      const allowed = validTransitions[currentStatus] || [];
      if (!allowed.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: `No se puede cambiar el estado de '${currentStatus}' a '${updates.status}'. Transiciones válidas: ${allowed.join(', ') || 'ninguna (estado final)'}`,
        });
      }
    }

    const oldValues = { status: order.status, priority: order.priority };
    await order.update(updates);

    // Audit log
    if (req.user) {
      createAuditLog({
        userId: req.user.id,
        entityType: 'maintenance_order',
        entityId: Number(id),
        action: 'update',
        oldValues,
        newValues: updates,
        ipAddress: getClientIp(req),
      });
    }

    const updatedOrder = await MaintenanceOrder.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
        },
        {
          model: MaintenanceType,
          as: 'maintenanceType',
        },
      ],
    });

    res.json({
      success: true,
      message: 'Maintenance order updated successfully',
      data: updatedOrder,
    });
  } catch (error: any) {
    logger.error('Error updating maintenance order', { error });
    res.status(500).json({
      success: false,
      message: 'Error updating maintenance order',
      error: 'Error interno del servidor',
    });
  }
};

export const completeMaintenanceOrder = async (req: AuthRequest, res: Response) => {
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
    const { actualCost, actualDuration, notes, partsReplaced, mileageAtService, nextServiceMileage } = req.body;

    const order = await MaintenanceOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance order not found',
      });
    }

    // Use database transaction to ensure atomicity
    const t = await sequelize.transaction();

    try {
      await (order as any).update({
        status: 'completed',
        completedDate: new Date(),
        actualCost,
        actualDuration,
        notes,
        partsReplaced: partsReplaced ? JSON.stringify(partsReplaced) : undefined,
        mileageAtService,
        nextServiceMileage,
      }, { transaction: t });

      // Update vehicle status back to available if it was in maintenance
      const vehicle = await Vehicle.findByPk(order.vehicleId, { transaction: t });
      if (vehicle?.status === 'maintenance') {
        await vehicle.update({ status: 'available' }, { transaction: t });
      }

      // Commit the transaction
      await t.commit();

      // Audit log (after commit so we don't slow down the transaction)
      if (req.user) {
        createAuditLog({
          userId: req.user.id,
          entityType: 'maintenance_order',
          entityId: Number(id),
          action: 'update',
          oldValues: { status: 'in_progress' },
          newValues: { status: 'completed', actualCost, actualDuration, mileageAtService },
          ipAddress: getClientIp(req),
        });
      }

      res.json({
        success: true,
        message: 'Maintenance order completed successfully',
        data: order,
      });
    } catch (error) {
      // Rollback in case of error
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error completing maintenance order', { error });
    res.status(500).json({
      success: false,
      message: 'Error completing maintenance order',
      error: 'Error interno del servidor',
    });
  }
};

export const getMaintenanceHistory = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const history = await MaintenanceOrder.findAll({
      where: { vehicleId },
      include: [
        {
          model: MaintenanceType,
          as: 'maintenanceType',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['scheduledDate', 'DESC']],
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    logger.error('Error fetching maintenance history', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance history',
      error: 'Error interno del servidor',
    });
  }
};
