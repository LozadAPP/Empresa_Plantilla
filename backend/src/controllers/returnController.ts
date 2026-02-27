import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Op } from 'sequelize';
import { differenceInDays } from 'date-fns';
import sequelize from '../config/database';
import Return from '../models/Return';
import Rental from '../models/Rental';
import Vehicle from '../models/Vehicle';
import { VehicleCondition } from '../models/Return';
import { RentalStatus } from '../models/Rental';
import { CodeGenerator } from '../services/codeGenerator';
import { RentalCalculator } from '../services/rentalCalculator';
import { RentalCascadeService } from '../services/rentalCascade';
import logger from '../config/logger';

/**
 * Controlador de Devoluciones
 * Maneja la inspección de vehículos, cálculo de penalidades y cierre de rentas
 */
export class ReturnController {

  /**
   * GET /api/returns
   * Obtener todas las devoluciones
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        rental_id,
        vehicle_id,
        location_id,
        condition,
        on_time,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (rental_id) where.rental_id = rental_id;
      if (vehicle_id) where.vehicle_id = vehicle_id;
      if (location_id) where.return_location_id = location_id;

      // Filtro por condición del vehículo
      if (condition) where.vehicle_condition = condition;

      // Filtro por entrega a tiempo
      if (on_time === 'true') where.is_on_time = true;
      if (on_time === 'false') where.is_on_time = false;

      // Filtro por rango de fechas
      if (startDate || endDate) {
        where.return_date = {};
        if (startDate) where.return_date[Op.gte] = new Date(startDate as string);
        if (endDate) where.return_date[Op.lte] = new Date(endDate as string);
      }

      // Búsqueda por texto
      const includeOptions: any[] = [
        { model: Rental, as: 'rental' },
        { model: Vehicle, as: 'vehicle' }
      ];

      if (search && typeof search === 'string') {
        const searchTerm = `%${search}%`;
        where[Op.or] = [
          { return_code: { [Op.iLike]: searchTerm } },
          { '$rental.rental_code$': { [Op.iLike]: searchTerm } },
          { '$vehicle.license_plate$': { [Op.iLike]: searchTerm } },
          { '$vehicle.make$': { [Op.iLike]: searchTerm } },
          { '$vehicle.model$': { [Op.iLike]: searchTerm } }
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: returns } = await Return.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: includeOptions,
        subQuery: false
      });

      res.json({
        success: true,
        data: {
          returns,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('[RETURN] Error obteniendo devoluciones', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener devoluciones',
      });
    }
  }

  /**
   * GET /api/returns/:id
   * Obtener una devolución por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const returnRecord = await Return.findByPk(id, {
        include: [
          { model: Rental, as: 'rental' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      if (!returnRecord) {
        return res.status(404).json({
          success: false,
          message: 'Devolución no encontrada'
        });
      }

      res.json({
        success: true,
        data: returnRecord
      });

    } catch (error) {
      logger.error('[RETURN] Error obteniendo devolución', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener devolución',
      });
    }
  }

  /**
   * POST /api/returns
   * Registrar una devolución con inspección y cálculo de penalidades
   */
  static async create(req: AuthRequest, res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const {
        rental_id,
        return_date,
        return_location_id,
        end_mileage,
        fuel_level,
        vehicle_condition,
        damage_description,
        damage_cost,
        cleaning_required,
        inspection_notes,
        photos
      } = req.body;

      // Validaciones
      if (!rental_id || !end_mileage || !fuel_level || !vehicle_condition) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: rental_id, end_mileage, fuel_level, vehicle_condition'
        });
      }

      // Obtener la renta
      const rental = await Rental.findByPk(rental_id, { transaction });

      if (!rental) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Renta no encontrada'
        });
      }

      if (rental.status === RentalStatus.COMPLETED) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Esta renta ya fue completada'
        });
      }

      if (rental.status === RentalStatus.CANCELLED) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Esta renta fue cancelada'
        });
      }

      // Verificar que el vehículo existe
      const vehicle = await Vehicle.findByPk(rental.vehicle_id, { transaction });
      if (!vehicle) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      // Validar que el kilometraje final sea mayor o igual al inicial
      if (rental.start_mileage !== undefined && end_mileage < rental.start_mileage) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El kilometraje final no puede ser menor al kilometraje inicial de la renta'
        });
      }

      // Fecha de devolución (si no se proporciona, usar fecha actual)
      const actualReturnDate = return_date ? new Date(return_date) : new Date();

      // Calcular si está a tiempo
      const daysLate = Math.max(0, differenceInDays(actualReturnDate, rental.end_date));
      const isOnTime = daysLate === 0;

      // Calcular penalidad por retraso
      const lateFee = daysLate > 0
        ? RentalCalculator.calculateLateFee(rental.daily_rate, daysLate)
        : 0;

      // Calcular costo de limpieza
      const cleaningCost = cleaning_required
        ? RentalCalculator.calculateCleaningCost(true)
        : 0;

      // Penalidad total
      const totalPenalty = lateFee + cleaningCost + (damage_cost || 0);

      // Generar código de devolución
      const returnCode = await CodeGenerator.generateReturnCode();

      // Crear registro de devolución
      const returnRecord = await Return.create({
        return_code: returnCode,
        rental_id,
        vehicle_id: rental.vehicle_id,
        return_date: actualReturnDate,
        return_location_id: return_location_id || rental.location_id,
        end_mileage,
        fuel_level,
        vehicle_condition: vehicle_condition as VehicleCondition,
        is_on_time: isOnTime,
        days_late: daysLate,
        late_fee: lateFee,
        damage_description,
        damage_cost: damage_cost || 0,
        cleaning_required: cleaning_required || false,
        cleaning_cost: cleaningCost,
        total_penalty: totalPenalty,
        inspected_by: req.user?.id,
        inspection_notes,
        photos: photos || []
      }, { transaction });

      // Ejecutar cascadas de devolución (con transacción)
      await RentalCascadeService.onRentalReturned(
        rental,
        {
          actual_return_date: actualReturnDate,
          end_mileage,
          fuel_level_end: fuel_level,
          total_penalty: totalPenalty
        },
        req.user?.id,
        transaction
      );

      // Commit de la transacción
      await transaction.commit();

      // Obtener el registro actualizado con relaciones (después del commit)
      const returnWithRelations = await Return.findByPk(returnRecord.id, {
        include: [
          { model: Rental, as: 'rental' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Devolución registrada exitosamente',
        data: returnWithRelations,
        penalties: {
          is_on_time: isOnTime,
          days_late: daysLate,
          late_fee: lateFee,
          cleaning_cost: cleaningCost,
          damage_cost: damage_cost || 0,
          total_penalty: totalPenalty
        }
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('[RETURN] Error registrando devolución', { error });
      res.status(500).json({
        success: false,
        message: 'Error al registrar devolución',
      });
    }
  }

  /**
   * PUT /api/returns/:id
   * Actualizar una devolución
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const returnRecord = await Return.findByPk(id);

      if (!returnRecord) {
        return res.status(404).json({
          success: false,
          message: 'Devolución no encontrada'
        });
      }

      // Si se actualiza información de daños, recalcular penalidad
      if (updates.damage_cost !== undefined || updates.cleaning_required !== undefined) {
        const cleaningCost = updates.cleaning_required || returnRecord.cleaning_required
          ? RentalCalculator.calculateCleaningCost(true)
          : 0;

        const damageCost = updates.damage_cost !== undefined
          ? updates.damage_cost
          : returnRecord.damage_cost || 0;

        const lateFee = returnRecord.late_fee || 0;

        updates.cleaning_cost = cleaningCost;
        updates.total_penalty = lateFee + cleaningCost + damageCost;
      }

      updates.updated_at = new Date();

      await returnRecord.update(updates);

      res.json({
        success: true,
        message: 'Devolución actualizada exitosamente',
        data: returnRecord
      });

    } catch (error) {
      logger.error('[RETURN] Error actualizando devolución', { error });
      res.status(500).json({
        success: false,
        message: 'Error al actualizar devolución',
      });
    }
  }

  /**
   * GET /api/returns/rental/:rentalId
   * Obtener devolución de una renta específica
   */
  static async getByRentalId(req: Request, res: Response) {
    try {
      const { rentalId } = req.params;

      const returnRecord = await Return.findOne({
        where: { rental_id: rentalId },
        include: [
          { model: Rental, as: 'rental' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      if (!returnRecord) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró devolución para esta renta'
        });
      }

      res.json({
        success: true,
        data: returnRecord
      });

    } catch (error) {
      logger.error('[RETURN] Error obteniendo devolución por rental_id', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener devolución',
      });
    }
  }
}
