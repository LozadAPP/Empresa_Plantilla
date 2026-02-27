import { Response } from 'express';
import { validationResult } from 'express-validator';
import vehicleService from '../services/vehicleService';
import { PDFService } from '../services/pdfService';
import { AuthRequest } from '../types';
import { AuditLog, Vehicle, VehicleType, Location } from '../models';
import logger from '../config/logger';
import { DocumentRegistrationService } from '../services/documentRegistrationService';

class VehicleController {
  /**
   * GET /vehicles
   * Get all vehicles with filters and pagination
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 25,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        status,
        location_id,
        vehicle_type_id,
        condition,
        search,
        minValue,
        maxValue,
        minYear,
        maxYear,
        minMileage,
        maxMileage
      } = req.query;

      const filters = {
        status: status as string,
        location_id: location_id ? parseInt(location_id as string) : undefined,
        vehicle_type_id: vehicle_type_id ? parseInt(vehicle_type_id as string) : undefined,
        condition: condition as string,
        search: search as string,
        minValue: minValue ? parseFloat(minValue as string) : undefined,
        maxValue: maxValue ? parseFloat(maxValue as string) : undefined,
        minYear: minYear ? parseInt(minYear as string) : undefined,
        maxYear: maxYear ? parseInt(maxYear as string) : undefined,
        minMileage: minMileage ? parseInt(minMileage as string) : undefined,
        maxMileage: maxMileage ? parseInt(maxMileage as string) : undefined
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC'
      };

      const result = await vehicleService.getAll(filters, pagination);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error('Get vehicles error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /vehicles/available
   * Get available vehicles
   */
  async getAvailable(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { location_id } = req.query;
      const locationId = location_id ? parseInt(location_id as string) : undefined;

      const vehicles = await vehicleService.getAvailable(locationId);

      res.status(200).json({
        success: true,
        data: vehicles
      });
    } catch (error: any) {
      logger.error('Get available vehicles error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /vehicles/statistics
   * Get vehicle statistics
   */
  async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { location_id } = req.query;
      const locationId = location_id ? parseInt(location_id as string) : undefined;

      const stats = await vehicleService.getStatistics(locationId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Get statistics error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /vehicles/by-type
   * Get vehicles grouped by type
   */
  async getByType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await vehicleService.getByTypeStatistics();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Get by type error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /vehicles/types
   * Get all vehicle types for dropdowns
   */
  async getVehicleTypes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const types = await VehicleType.findAll({
        attributes: ['id', 'name', 'description', 'daily_rate'],
        order: [['name', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: types
      });
    } catch (error: any) {
      logger.error('Get vehicle types error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /vehicles/:id
   * Get vehicle by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getById(parseInt(id));

      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: vehicle
      });
    } catch (error: any) {
      logger.error('Get vehicle error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /vehicles
   * Create new vehicle
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const vehicle = await vehicleService.create(req.body);

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'vehicle',
          entity_id: vehicle.id,
          action: 'create',
          new_values: req.body,
          ip_address: req.ip
        });
      }

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle
      });
    } catch (error: any) {
      logger.error('Create vehicle error', { error });
      res.status(400).json({
        success: false,
        message: 'Failed to create vehicle'
      });
    }
  }

  /**
   * PUT /vehicles/:id
   * Update vehicle
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const oldVehicle = await vehicleService.getById(parseInt(id));

      if (!oldVehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      const vehicle = await vehicleService.update(parseInt(id), req.body);

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'vehicle',
          entity_id: parseInt(id),
          action: 'update',
          old_values: oldVehicle.toJSON(),
          new_values: req.body,
          ip_address: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle
      });
    } catch (error: any) {
      logger.error('Update vehicle error', { error });
      res.status(400).json({
        success: false,
        message: 'Failed to update vehicle'
      });
    }
  }

  /**
   * PATCH /vehicles/:id/status
   * Update vehicle status
   */
  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['available', 'rented', 'maintenance'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be available, rented, or maintenance'
        });
        return;
      }

      const vehicle = await vehicleService.updateStatus(parseInt(id), status);

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'vehicle',
          entity_id: parseInt(id),
          action: 'update',
          new_values: { status },
          ip_address: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: 'Vehicle status updated successfully',
        data: vehicle
      });
    } catch (error: any) {
      logger.error('Update status error', { error });
      res.status(400).json({
        success: false,
        message: 'Failed to update vehicle status'
      });
    }
  }

  /**
   * DELETE /vehicles/:id
   * Delete vehicle
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getById(parseInt(id));

      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      await vehicleService.delete(parseInt(id));

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'vehicle',
          entity_id: parseInt(id),
          action: 'delete',
          old_values: vehicle.toJSON(),
          ip_address: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete vehicle error', { error });
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete vehicle'
      });
    }
  }

  /**
   * GET /vehicles/:id/ficha-pdf
   * Download vehicle technical spec sheet as PDF
   */
  async downloadFicha(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findByPk(id, {
        include: [
          { model: VehicleType, as: 'vehicleType' },
          { model: Location, as: 'location' },
        ],
      });

      if (!vehicle) {
        res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
        return;
      }

      const pdfPath = await PDFService.generateFicha(vehicle);
      const filename = `ficha-tecnica-${vehicle.license_plate || vehicle.id}.pdf`;

      // Fire-and-forget document registration
      DocumentRegistrationService.registerAutoDocument({
        documentType: 'ficha',
        name: `Ficha Técnica - ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
        filePath: pdfPath,
        entityType: 'vehicle',
        entityId: vehicle.id,
        userId: req.user?.id,
      }).catch(() => {});

      res.download(pdfPath, filename);
    } catch (error: any) {
      logger.error('Download ficha PDF error', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar ficha técnica'
      });
    }
  }
}

export default new VehicleController();
