import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Location from '../models/Location';
import Vehicle from '../models/Vehicle';
import User from '../models/User';
import logger from '../config/logger';

// ====================================
// GET ALL LOCATIONS
// ====================================

export const getLocations = async (req: Request, res: Response) => {
  try {
    const { search, type, isActive, page = 1, limit = 10 } = req.query;

    const where: any = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { state: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Type filter
    if (type) {
      where.type = type;
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: locations, count: total } = await Location.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: Number(limit),
      offset,
    });

    // Get vehicle and user counts for each location
    const locationsWithCounts = await Promise.all(
      locations.map(async (location) => {
        const vehicleCount = await Vehicle.count({
          where: { location_id: location.id },
        });
        const userCount = await User.count({
          where: { location_id: location.id },
        });

        return {
          ...location.toJSON(),
          vehicleCount,
          userCount,
        };
      })
    );

    res.json({
      success: true,
      data: locationsWithCounts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching locations', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
    });
  }
};

// ====================================
// GET LOCATION BY ID
// ====================================

export const getLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Get vehicle and user counts
    const vehicleCount = await Vehicle.count({
      where: { location_id: location.id },
    });
    const userCount = await User.count({
      where: { location_id: location.id },
    });

    res.json({
      success: true,
      data: {
        ...location.toJSON(),
        vehicleCount,
        userCount,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching location', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching location',
    });
  }
};

// ====================================
// CREATE LOCATION
// ====================================

export const createLocation = async (req: Request, res: Response) => {
  try {
    const {
      name,
      address,
      city,
      state,
      country,
      zipCode,
      coordinates,
      type,
      contactName,
      contactPhone,
      contactEmail,
      notes,
    } = req.body;

    // Check if name already exists
    const existingLocation = await Location.findOne({ where: { name } });
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'A location with this name already exists',
      });
    }

    const location = await Location.create({
      name,
      address,
      city,
      state,
      country: country || 'México',
      zipCode,
      coordinates: coordinates || { lat: 19.432608, lng: -99.133209 },
      type: type || 'office',
      contactName,
      contactPhone,
      contactEmail,
      notes,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location,
    });
  } catch (error: any) {
    logger.error('Error creating location', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating location',
    });
  }
};

// ====================================
// UPDATE LOCATION
// ====================================

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Check name uniqueness if changed
    if (updates.name && updates.name !== location.name) {
      const existingLocation = await Location.findOne({
        where: { name: updates.name },
      });
      if (existingLocation) {
        return res.status(400).json({
          success: false,
          message: 'A location with this name already exists',
        });
      }
    }

    await location.update(updates);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location,
    });
  } catch (error: any) {
    logger.error('Error updating location', { error });
    res.status(500).json({
      success: false,
      message: 'Error updating location',
    });
  }
};

// ====================================
// TOGGLE LOCATION STATUS
// ====================================

export const toggleLocationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Check if there are active vehicles or users
    if (location.isActive) {
      const vehicleCount = await Vehicle.count({
        where: { location_id: location.id },
      });
      const userCount = await User.count({
        where: { location_id: location.id, is_active: true },
      });

      if (vehicleCount > 0 || userCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot deactivate location. It has ${vehicleCount} vehicles and ${userCount} active users assigned.`,
        });
      }
    }

    await location.update({
      isActive: !location.isActive,
    });

    res.json({
      success: true,
      message: `Location ${location.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: location.id,
        isActive: location.isActive,
      },
    });
  } catch (error: any) {
    logger.error('Error toggling location status', { error });
    res.status(500).json({
      success: false,
      message: 'Error toggling location status',
    });
  }
};

// ====================================
// GET LOCATION STATS
// ====================================

export const getLocationStats = async (req: Request, res: Response) => {
  try {
    const totalLocations = await Location.count();
    const activeLocations = await Location.count({ where: { isActive: true } });
    const inactiveLocations = await Location.count({ where: { isActive: false } });

    // Get total vehicles and users across all locations
    const totalVehicles = await Vehicle.count();
    const totalUsers = await User.count();

    // Get locations by type
    const officeCount = await Location.count({ where: { type: 'office' } });
    const warehouseCount = await Location.count({ where: { type: 'warehouse' } });
    const maintenanceCount = await Location.count({ where: { type: 'maintenance' } });
    const otherCount = await Location.count({ where: { type: 'other' } });

    res.json({
      success: true,
      data: {
        total: totalLocations,
        active: activeLocations,
        inactive: inactiveLocations,
        totalVehicles,
        totalUsers,
        averageVehicles: totalLocations > 0 ? Math.round(totalVehicles / totalLocations) : 0,
        averageUsers: totalLocations > 0 ? Math.round(totalUsers / totalLocations) : 0,
        byType: {
          office: officeCount,
          warehouse: warehouseCount,
          maintenance: maintenanceCount,
          other: otherCount,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching location stats', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching location stats',
    });
  }
};

// ====================================
// GET LOCATIONS FOR DROPDOWN
// ====================================

export const getLocationsDropdown = async (req: Request, res: Response) => {
  try {
    const locations = await Location.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'city', 'state'],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: locations,
    });
  } catch (error: any) {
    logger.error('Error fetching locations dropdown', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
    });
  }
};

export default {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  toggleLocationStatus,
  getLocationStats,
  getLocationsDropdown,
};
