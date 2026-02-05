import { Request, Response } from 'express';
import { ExtraService, VehicleType, Location, RentalService } from '../models';
import { Op } from 'sequelize';

// ====================================
// GET ALL EXTRA SERVICES (Active only)
// ====================================
export const getExtraServices = async (req: Request, res: Response) => {
  try {
    const { category, vehicle_type_id, location_id } = req.query;

    const where: any = { is_active: true };
    if (category) where.category = category;
    if (vehicle_type_id) where.vehicle_type_id = vehicle_type_id;
    if (location_id) {
      where[Op.or] = [
        { location_id: null },
        { location_id: location_id }
      ];
    }

    const services = await ExtraService.findAll({
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
      ],
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    console.error('Error fetching extra services:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios adicionales',
    });
  }
};

// ====================================
// GET ALL EXTRA SERVICES (Including inactive - Admin)
// ====================================
export const getAllExtraServices = async (req: Request, res: Response) => {
  try {
    const { category, vehicle_type_id, location_id, is_active } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (vehicle_type_id) where.vehicle_type_id = vehicle_type_id;
    if (location_id) where.location_id = location_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const services = await ExtraService.findAll({
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
      ],
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    console.error('Error fetching all extra services:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios adicionales',
    });
  }
};

// ====================================
// GET SINGLE EXTRA SERVICE
// ====================================
export const getExtraServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await ExtraService.findByPk(id, {
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
      ],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado',
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error('Error fetching extra service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicio',
    });
  }
};

// ====================================
// CREATE EXTRA SERVICE
// ====================================
export const createExtraService = async (req: Request, res: Response) => {
  try {
    const { name, description, price, price_type, category, vehicle_type_id, location_id } = req.body;

    if (!name || price === undefined || !price_type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio, tipo de precio y categoría son requeridos',
      });
    }

    const service = await ExtraService.create({
      name,
      description,
      price,
      price_type,
      category,
      vehicle_type_id: vehicle_type_id || null,
      location_id: location_id || null,
      is_active: true,
    });

    const serviceWithDetails = await ExtraService.findByPk(service.id, {
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
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: serviceWithDetails,
    });
  } catch (error: any) {
    console.error('Error creating extra service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear servicio',
    });
  }
};

// ====================================
// UPDATE EXTRA SERVICE
// ====================================
export const updateExtraService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, price_type, category, vehicle_type_id, location_id, is_active } = req.body;

    const service = await ExtraService.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado',
      });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (price_type !== undefined) updates.price_type = price_type;
    if (category !== undefined) updates.category = category;
    if (vehicle_type_id !== undefined) updates.vehicle_type_id = vehicle_type_id || null;
    if (location_id !== undefined) updates.location_id = location_id || null;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date();

    await service.update(updates);

    const updatedService = await ExtraService.findByPk(id, {
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
      ],
    });

    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: updatedService,
    });
  } catch (error: any) {
    console.error('Error updating extra service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio',
    });
  }
};

// ====================================
// TOGGLE SERVICE ACTIVE STATUS
// ====================================
export const toggleExtraServiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await ExtraService.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado',
      });
    }

    await service.update({
      is_active: !service.is_active,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      message: service.is_active ? 'Servicio activado' : 'Servicio desactivado',
      data: service,
    });
  } catch (error: any) {
    console.error('Error toggling extra service status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del servicio',
    });
  }
};

// ====================================
// DELETE EXTRA SERVICE (Soft delete - deactivate)
// ====================================
export const deleteExtraService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await ExtraService.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado',
      });
    }

    // Check if service has been used in any rentals
    const usageCount = await RentalService.count({
      where: { extra_service_id: id },
    });

    if (usageCount > 0) {
      // Soft delete - just deactivate
      await service.update({
        is_active: false,
        updated_at: new Date(),
      });

      return res.json({
        success: true,
        message: `Servicio desactivado (tiene ${usageCount} usos en rentas)`,
        data: service,
      });
    }

    // Hard delete if never used
    await service.destroy();

    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting extra service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar servicio',
    });
  }
};

// ====================================
// GET SERVICES BY CATEGORY
// ====================================
export const getServicesByCategory = async (req: Request, res: Response) => {
  try {
    const services = await ExtraService.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'price', 'price_type', 'category'],
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    // Group by category
    const grouped = services.reduce((acc: any, service) => {
      const cat = service.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(service);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error: any) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios por categoría',
    });
  }
};
