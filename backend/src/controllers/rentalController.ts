import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Rental from '../models/Rental';
import Vehicle from '../models/Vehicle';
import Customer from '../models/Customer';
import { RentalStatus, PaymentMethod } from '../models/Rental';
import { VehicleStatus } from '../models/Vehicle';
import { RentalCalculator } from '../services/rentalCalculator';
import { CodeGenerator } from '../services/codeGenerator';
import { RentalCascadeService } from '../services/rentalCascade';

/**
 * Controlador de Rentas
 * Maneja la creación, consulta, actualización de rentas
 */
export class RentalController {

  /**
   * GET /api/rentals
   * Obtener todas las rentas con filtros opcionales
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        status,
        customer_id,
        vehicle_id,
        location_id,
        start_date,
        end_date,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (status) where.status = status;
      if (customer_id) where.customer_id = customer_id;
      if (vehicle_id) where.vehicle_id = vehicle_id;
      if (location_id) where.location_id = location_id;

      if (start_date || end_date) {
        where.start_date = {};
        if (start_date) where.start_date.$gte = new Date(start_date as string);
        if (end_date) where.start_date.$lte = new Date(end_date as string);
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: rentals } = await Rental.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      res.json({
        success: true,
        data: {
          rentals,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('[RENTAL] Error obteniendo rentas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener rentas',
      });
    }
  }

  /**
   * GET /api/rentals/:id
   * Obtener una renta por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const rental = await Rental.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Renta no encontrada'
        });
      }

      res.json({
        success: true,
        data: rental
      });

    } catch (error) {
      console.error('[RENTAL] Error obteniendo renta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener renta',
      });
    }
  }

  /**
   * POST /api/rentals
   * Crear una nueva renta con cálculos automáticos y cascadas
   */
  static async create(req: Request, res: Response) {
    try {
      const {
        customer_id,
        vehicle_id,
        location_id,
        return_location_id,
        start_date,
        end_date,
        daily_rate,
        tax_percentage,
        discount_percentage,
        insurance_amount,
        extras_amount,
        deposit_amount,
        payment_method,
        start_mileage,
        fuel_level_start,
        notes
      } = req.body;

      // Validaciones
      if (!customer_id || !vehicle_id || !location_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: customer_id, vehicle_id, location_id, start_date, end_date'
        });
      }

      // Verificar que el cliente existe y está activo
      const customer = await Customer.findByPk(customer_id);
      if (!customer || !customer.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cliente no encontrado o inactivo'
        });
      }

      // Verificar que el vehículo existe y está disponible
      const vehicle = await Vehicle.findByPk(vehicle_id);
      if (!vehicle || !vehicle.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Vehículo no encontrado o inactivo'
        });
      }

      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        return res.status(400).json({
          success: false,
          message: `Vehículo no disponible. Estado actual: ${vehicle.status}`
        });
      }

      // Validar fechas
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const now = new Date();

      if (startDate < now) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio no puede ser en el pasado'
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      // CRÍTICO: Validar que el vehículo NO esté rentado en las fechas solicitadas
      const overlappingRental = await Rental.findOne({
        where: {
          vehicle_id,
          status: ['reserved', 'active'], // Solo rentas activas
          [Op.or]: [
            // Caso 1: Nueva renta empieza durante una renta existente
            {
              start_date: { [Op.lte]: startDate },
              end_date: { [Op.gte]: startDate }
            },
            // Caso 2: Nueva renta termina durante una renta existente
            {
              start_date: { [Op.lte]: endDate },
              end_date: { [Op.gte]: endDate }
            },
            // Caso 3: Nueva renta cubre completamente una renta existente
            {
              start_date: { [Op.gte]: startDate },
              end_date: { [Op.lte]: endDate }
            }
          ]
        }
      });

      if (overlappingRental) {
        return res.status(400).json({
          success: false,
          message: `El vehículo ya está rentado del ${new Date(overlappingRental.start_date).toLocaleDateString('es-MX')} al ${new Date(overlappingRental.end_date).toLocaleDateString('es-MX')}. Por favor elige otras fechas.`,
          conflictingRental: {
            id: overlappingRental.id,
            code: overlappingRental.rental_code,
            start_date: overlappingRental.start_date,
            end_date: overlappingRental.end_date
          }
        });
      }

      // Usar tarifa del vehículo si no se proporciona
      const finalDailyRate = daily_rate || vehicle.daily_rate;

      // Calcular montos automáticamente
      const calculation = RentalCalculator.calculate({
        start_date: startDate,
        end_date: endDate,
        daily_rate: finalDailyRate,
        tax_percentage,
        discount_percentage,
        insurance_amount,
        extras_amount
      });

      // Generar código único de renta
      const rentalCode = await CodeGenerator.generateRentalCode();

      // Crear la renta
      const rental = await Rental.create({
        rental_code: rentalCode,
        customer_id,
        vehicle_id,
        location_id,
        return_location_id: return_location_id || location_id,
        start_date: startDate,
        end_date: endDate,
        days: calculation.days,
        daily_rate: calculation.daily_rate,
        subtotal: calculation.subtotal,
        tax_percentage: calculation.tax_percentage,
        tax_amount: calculation.tax_amount,
        discount_percentage: calculation.discount_percentage,
        discount_amount: calculation.discount_amount,
        insurance_amount: calculation.insurance_amount,
        extras_amount: calculation.extras_amount,
        total_amount: calculation.total_amount,
        deposit_amount: deposit_amount || 0,
        payment_method: payment_method as PaymentMethod,
        status: RentalStatus.ACTIVE,
        created_by: (req as any).user?.id, // Asume middleware de autenticación
        start_mileage: start_mileage || vehicle.mileage,
        fuel_level_start: fuel_level_start || 'full',
        notes
      });

      // Ejecutar cascadas automáticas en segundo plano
      // No esperamos a que terminen para responder al cliente
      RentalCascadeService.onRentalCreated(rental, (req as any).user?.id)
        .catch(error => {
          console.error('[RENTAL] Error en cascadas:', error);
        });

      res.status(201).json({
        success: true,
        message: 'Renta creada exitosamente. Se están procesando las notificaciones.',
        data: rental
      });

    } catch (error) {
      console.error('[RENTAL] Error creando renta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear renta',
      });
    }
  }

  /**
   * PUT /api/rentals/:id
   * Actualizar una renta existente
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const rental = await Rental.findByPk(id);

      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Renta no encontrada'
        });
      }

      // No permitir actualizar rentas completadas
      if (rental.status === RentalStatus.COMPLETED) {
        return res.status(400).json({
          success: false,
          message: 'No se puede actualizar una renta completada'
        });
      }

      // Si se actualizan fechas, recalcular montos
      if (updates.start_date || updates.end_date) {
        const startDate = new Date(updates.start_date || rental.start_date);
        const endDate = new Date(updates.end_date || rental.end_date);

        const calculation = RentalCalculator.calculate({
          start_date: startDate,
          end_date: endDate,
          daily_rate: updates.daily_rate || rental.daily_rate,
          tax_percentage: updates.tax_percentage || rental.tax_percentage,
          discount_percentage: updates.discount_percentage || rental.discount_percentage,
          insurance_amount: updates.insurance_amount || rental.insurance_amount,
          extras_amount: updates.extras_amount || rental.extras_amount
        });

        Object.assign(updates, {
          days: calculation.days,
          subtotal: calculation.subtotal,
          tax_amount: calculation.tax_amount,
          discount_amount: calculation.discount_amount,
          total_amount: calculation.total_amount,
          updated_at: new Date()
        });
      }

      await rental.update(updates);

      res.json({
        success: true,
        message: 'Renta actualizada exitosamente',
        data: rental
      });

    } catch (error) {
      console.error('[RENTAL] Error actualizando renta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar renta',
      });
    }
  }

  /**
   * DELETE /api/rentals/:id
   * Cancelar una renta (soft delete)
   */
  static async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const rental = await Rental.findByPk(id);

      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Renta no encontrada'
        });
      }

      if (rental.status === RentalStatus.COMPLETED) {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar una renta completada'
        });
      }

      // Marcar como cancelada
      await rental.update({
        status: RentalStatus.CANCELLED,
        notes: rental.notes ? `${rental.notes}\n\nCancelada: ${reason}` : `Cancelada: ${reason}`,
        updated_at: new Date()
      });

      // Liberar el vehículo
      await Vehicle.update(
        { status: VehicleStatus.AVAILABLE },
        { where: { id: rental.vehicle_id } }
      );

      res.json({
        success: true,
        message: 'Renta cancelada exitosamente',
        data: rental
      });

    } catch (error) {
      console.error('[RENTAL] Error cancelando renta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cancelar renta',
      });
    }
  }
}
