import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';
import PriceConfig from '../models/PriceConfig';
import VehicleType from '../models/VehicleType';
import Location from '../models/Location';
import User from '../models/User';
import { Op } from 'sequelize';
import logger from '../config/logger';
import { AuthRequest } from '../types';

// ====================================
// SYSTEM CONFIGURATION
// ====================================

export const getSystemConfigs = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category) where.category = category;

    const configs = await SystemConfig.findAll({
      where,
      include: [
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['category', 'ASC'], ['configKey', 'ASC']],
    });

    res.json({
      success: true,
      data: configs,
    });
  } catch (error: any) {
    logger.error('Error fetching system configs', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching system configs',
    });
  }
};

export const getConfigByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const config = await SystemConfig.findOne({
      where: { configKey: key },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found',
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    logger.error('Error fetching configuration', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration',
    });
  }
};

export const updateSystemConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { configValue, description } = req.body;
    const userId = req.user!.id;

    const config = await SystemConfig.findByPk(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found',
      });
    }

    if (!config.isEditable) {
      return res.status(403).json({
        success: false,
        message: 'This configuration is not editable',
      });
    }

    const updateData: any = {
      configValue,
      updatedBy: userId,
    };

    if (description !== undefined) {
      updateData.description = description;
    }

    await config.update(updateData);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config,
    });
  } catch (error: any) {
    logger.error('Error updating configuration', { error });
    res.status(500).json({
      success: false,
      message: 'Error updating configuration',
    });
  }
};

export const createSystemConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { configKey, configValue, configType, category, description, isEditable } = req.body;
    const userId = req.user!.id;

    const config = await SystemConfig.create({
      configKey,
      configValue,
      configType: configType || 'string',
      category: category || 'general',
      description,
      isEditable: isEditable !== undefined ? isEditable : true,
      updatedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      data: config,
    });
  } catch (error: any) {
    logger.error('Error creating configuration', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating configuration',
    });
  }
};

// ====================================
// PRICE CONFIGURATION
// ====================================

export const getPriceConfigs = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId, locationId, isActive } = req.query;

    const where: any = {};
    if (vehicleTypeId) where.vehicleTypeId = vehicleTypeId;
    if (locationId) where.locationId = locationId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const configs = await PriceConfig.findAll({
      where,
      include: [
        {
          model: VehicleType,
          as: 'vehicleType',
          attributes: ['id', 'name'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'city'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['effectiveFrom', 'DESC']],
    });

    res.json({
      success: true,
      data: configs,
    });
  } catch (error: any) {
    logger.error('Error fetching price configs', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching price configs',
    });
  }
};

export const getActivePriceConfig = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId, locationId } = req.query;

    if (!vehicleTypeId) {
      return res.status(400).json({
        success: false,
        message: 'vehicleTypeId is required',
      });
    }

    const now = new Date();
    const where: any = {
      vehicleTypeId,
      isActive: true,
      effectiveFrom: { [Op.lte]: now },
      [Op.or]: [
        { effectiveUntil: null },
        { effectiveUntil: { [Op.gte]: now } },
      ],
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const config = await PriceConfig.findOne({
      where,
      include: [
        {
          model: VehicleType,
          as: 'vehicleType',
        },
        {
          model: Location,
          as: 'location',
        },
      ],
      order: [['effectiveFrom', 'DESC']],
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No active price configuration found',
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    logger.error('Error fetching active price config', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching active price config',
    });
  }
};

export const createPriceConfig = async (req: AuthRequest, res: Response) => {
  try {
    const {
      vehicleTypeId,
      locationId,
      season,
      dailyRate,
      weeklyRate,
      monthlyRate,
      minimumRentalDays,
      discountPercentage,
      extraHourRate,
      extraDayRate,
      insuranceRate,
      depositAmount,
      lateFeePerDay,
      effectiveFrom,
      effectiveUntil,
      notes,
    } = req.body;

    const userId = req.user!.id;

    // Validate FK references exist
    if (vehicleTypeId) {
      const vehicleType = await VehicleType.findByPk(vehicleTypeId);
      if (!vehicleType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de vehículo no encontrado',
        });
      }
    }

    if (locationId) {
      const location = await Location.findByPk(locationId);
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Ubicación no encontrada',
        });
      }
    }

    const config = await PriceConfig.create({
      vehicleTypeId,
      locationId,
      season,
      dailyRate,
      weeklyRate,
      monthlyRate,
      minimumRentalDays,
      discountPercentage,
      extraHourRate,
      extraDayRate,
      insuranceRate,
      depositAmount,
      lateFeePerDay,
      effectiveFrom,
      effectiveUntil,
      isActive: true,
      notes,
      createdBy: userId,
    });

    const configWithDetails = await PriceConfig.findByPk(config.id, {
      include: [
        {
          model: VehicleType,
          as: 'vehicleType',
        },
        {
          model: Location,
          as: 'location',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Price configuration created successfully',
      data: configWithDetails,
    });
  } catch (error: any) {
    logger.error('Error creating price configuration', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating price configuration',
    });
  }
};

export const updatePriceConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Whitelist of allowed fields for update
    const allowedFields = [
      'vehicleTypeId', 'locationId', 'season', 'dailyRate', 'weeklyRate',
      'monthlyRate', 'minimumRentalDays', 'discountPercentage', 'extraHourRate',
      'extraDayRate', 'insuranceRate', 'depositAmount', 'lateFeePerDay',
      'effectiveFrom', 'effectiveUntil', 'isActive', 'notes'
    ];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const config = await PriceConfig.findByPk(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Price configuration not found',
      });
    }

    await config.update(updates);

    const updatedConfig = await PriceConfig.findByPk(id, {
      include: [
        {
          model: VehicleType,
          as: 'vehicleType',
        },
        {
          model: Location,
          as: 'location',
        },
      ],
    });

    res.json({
      success: true,
      message: 'Price configuration updated successfully',
      data: updatedConfig,
    });
  } catch (error: any) {
    logger.error('Error updating price configuration', { error });
    res.status(500).json({
      success: false,
      message: 'Error updating price configuration',
    });
  }
};

export const deactivatePriceConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const config = await PriceConfig.findByPk(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Price configuration not found',
      });
    }

    await config.update({ isActive: false });

    res.json({
      success: true,
      message: 'Price configuration deactivated successfully',
      data: config,
    });
  } catch (error: any) {
    logger.error('Error deactivating price configuration', { error });
    res.status(500).json({
      success: false,
      message: 'Error deactivating price configuration',
    });
  }
};
