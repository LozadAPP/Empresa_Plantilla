import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Rental from '../models/Rental';
import Vehicle from '../models/Vehicle';
import Customer from '../models/Customer';
import Payment from '../models/Payment';
import Return from '../models/Return';
import Alert from '../models/Alert';
import { RentalStatus, PaymentMethod } from '../models/Rental';
import { VehicleStatus } from '../models/Vehicle';
import { RentalCalculator } from '../services/rentalCalculator';
import { CodeGenerator } from '../services/codeGenerator';
import { RentalCascadeService } from '../services/rentalCascade';

// Roles que pueden crear rentas sin necesidad de aprobación
const ROLES_SIN_APROBACION = new Set(['admin', 'director_general', 'jefe_ventas']);

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
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (status) where.status = status;
      if (customer_id) where.customer_id = customer_id;
      if (vehicle_id) where.vehicle_id = vehicle_id;
      if (location_id) where.location_id = location_id;

      if (startDate || endDate) {
        where.start_date = {};
        if (startDate) where.start_date[Op.gte] = new Date(startDate as string);
        if (endDate) where.start_date[Op.lte] = new Date(endDate as string);
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
          { model: Vehicle, as: 'vehicle' },
          { model: Payment, as: 'payments' },
          { model: Return, as: 'return' }
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
        shipping_cost,
        price_adjustment,
        adjustment_reason,
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
          status: { [Op.in]: [RentalStatus.RESERVED, RentalStatus.ACTIVE, RentalStatus.PENDING_APPROVAL] },
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
        extras_amount,
        shipping_cost,
        price_adjustment
      });

      // Generar código único de renta
      const rentalCode = await CodeGenerator.generateRentalCode();

      // Determinar si necesita aprobación basado en el rol del creador
      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || (req as any).user?.email || 'Usuario';
      const necesitaAprobacion = !ROLES_SIN_APROBACION.has(userRole);

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
        shipping_cost: calculation.shipping_cost,
        price_adjustment: calculation.price_adjustment,
        adjustment_reason: adjustment_reason || null,
        total_amount: calculation.total_amount,
        deposit_amount: deposit_amount || 0,
        payment_method: payment_method as PaymentMethod,
        status: necesitaAprobacion ? RentalStatus.PENDING_APPROVAL : RentalStatus.ACTIVE,
        created_by: userId,
        start_mileage: start_mileage || vehicle.mileage,
        fuel_level_start: fuel_level_start || 'full',
        notes
      });

      // Lógica según si necesita aprobación o no
      if (necesitaAprobacion) {
        // Crear alerta para aprobadores
        await Alert.create({
          alertType: 'rental_pending_approval',
          severity: 'warning',
          title: `Nueva renta pendiente: ${rental.rental_code}`,
          message: `${userName} ha creado una renta que requiere aprobación. Cliente: ${customer.name || customer.contact_person}, Vehículo: ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}), Total: $${calculation.total_amount.toFixed(2)}`,
          entityType: 'rental',
          entityId: rental.id.toString(),
          metadata: JSON.stringify({
            rentalCode: rental.rental_code,
            customerId: rental.customer_id,
            customerName: customer.name || customer.contact_person,
            vehicleId: rental.vehicle_id,
            vehiclePlate: vehicle.license_plate,
            totalAmount: rental.total_amount,
            createdBy: userId,
            createdByName: userName
          })
        });
        console.log(`[RENTAL] Renta ${rental.rental_code} creada con estado PENDING_APPROVAL`);

        res.status(201).json({
          success: true,
          message: 'Renta creada exitosamente. Pendiente de aprobación por un supervisor.',
          data: rental,
          requiresApproval: true
        });
      } else {
        // Ejecutar cascadas automáticas (marcar vehículo como rentado, etc.)
        RentalCascadeService.onRentalCreated(rental, userId)
          .catch(error => {
            console.error('[RENTAL] Error en cascadas:', error);
          });

        res.status(201).json({
          success: true,
          message: 'Renta creada exitosamente. Se están procesando las notificaciones.',
          data: rental,
          requiresApproval: false
        });
      }

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

      // Si se actualizan fechas o montos, recalcular
      const needsRecalculation = updates.start_date || updates.end_date ||
        updates.daily_rate !== undefined || updates.discount_percentage !== undefined ||
        updates.insurance_amount !== undefined || updates.extras_amount !== undefined ||
        updates.shipping_cost !== undefined || updates.price_adjustment !== undefined;

      if (needsRecalculation) {
        const startDate = new Date(updates.start_date || rental.start_date);
        const endDate = new Date(updates.end_date || rental.end_date);

        const calculation = RentalCalculator.calculate({
          start_date: startDate,
          end_date: endDate,
          daily_rate: updates.daily_rate ?? rental.daily_rate,
          tax_percentage: updates.tax_percentage ?? rental.tax_percentage,
          discount_percentage: updates.discount_percentage ?? rental.discount_percentage,
          insurance_amount: updates.insurance_amount ?? rental.insurance_amount,
          extras_amount: updates.extras_amount ?? rental.extras_amount,
          shipping_cost: updates.shipping_cost ?? rental.shipping_cost,
          price_adjustment: updates.price_adjustment ?? rental.price_adjustment
        });

        Object.assign(updates, {
          days: calculation.days,
          subtotal: calculation.subtotal,
          tax_amount: calculation.tax_amount,
          discount_amount: calculation.discount_amount,
          shipping_cost: calculation.shipping_cost,
          price_adjustment: calculation.price_adjustment,
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

  // ============================================
  // MÉTODOS DE APROBACIÓN DE RENTAS
  // ============================================

  /**
   * GET /api/rentals/pending-approvals
   * Obtener rentas pendientes de aprobación
   */
  static async getPendingApprovals(req: Request, res: Response) {
    try {
      const rentals = await Rental.findAll({
        where: { status: RentalStatus.PENDING_APPROVAL },
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' }
        ],
        order: [['created_at', 'ASC']] // Más antiguas primero
      });

      res.json({
        success: true,
        data: rentals,
        count: rentals.length
      });
    } catch (error) {
      console.error('[RENTAL] Error obteniendo rentas pendientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener rentas pendientes de aprobación'
      });
    }
  }

  /**
   * POST /api/rentals/:id/approve
   * Aprobar una renta pendiente
   */
  static async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || (req as any).user?.email || 'Supervisor';

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

      if (rental.status !== RentalStatus.PENDING_APPROVAL) {
        return res.status(400).json({
          success: false,
          message: `Solo se pueden aprobar rentas pendientes. Estado actual: ${rental.status}`
        });
      }

      // Verificar que el vehículo sigue disponible
      const vehicle = await Vehicle.findByPk(rental.vehicle_id);
      if (vehicle?.status !== VehicleStatus.AVAILABLE) {
        return res.status(400).json({
          success: false,
          message: 'El vehículo ya no está disponible. La renta no puede ser aprobada.'
        });
      }

      // Actualizar renta a ACTIVE
      await rental.update({
        status: RentalStatus.ACTIVE,
        approved_by: userId,
        approved_at: new Date()
      });

      // Ejecutar cascadas (marcar vehículo como rentado, etc.)
      await RentalCascadeService.onRentalCreated(rental, userId);

      // Crear alerta de aprobación para el creador
      await Alert.create({
        alertType: 'rental_approved',
        severity: 'info',
        title: `Renta aprobada: ${rental.rental_code}`,
        message: `Tu renta ${rental.rental_code} ha sido aprobada por ${userName} y está activa.`,
        entityType: 'rental',
        entityId: rental.id.toString(),
        assignedTo: rental.created_by,
        metadata: JSON.stringify({
          rentalCode: rental.rental_code,
          approvedBy: userId,
          approvedByName: userName,
          approvedAt: new Date()
        })
      });

      // Resolver la alerta de pendiente
      await Alert.update(
        {
          isResolved: true,
          resolvedBy: userId,
          resolvedAt: new Date()
        },
        {
          where: {
            entityType: 'rental',
            entityId: rental.id.toString(),
            alertType: 'rental_pending_approval',
            isResolved: false
          }
        }
      );

      console.log(`[RENTAL] Renta ${rental.rental_code} APROBADA por usuario ${userId}`);

      res.json({
        success: true,
        message: 'Renta aprobada exitosamente',
        data: rental
      });

    } catch (error) {
      console.error('[RENTAL] Error aprobando renta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al aprobar renta'
      });
    }
  }

  /**
   * POST /api/rentals/:id/reject
   * Rechazar una renta pendiente
   */
  static async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || (req as any).user?.email || 'Supervisor';

      // Validar razón
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar una razón de al menos 10 caracteres'
        });
      }

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

      if (rental.status !== RentalStatus.PENDING_APPROVAL) {
        return res.status(400).json({
          success: false,
          message: `Solo se pueden rechazar rentas pendientes. Estado actual: ${rental.status}`
        });
      }

      // Actualizar renta a CANCELLED con razón de rechazo
      await rental.update({
        status: RentalStatus.CANCELLED,
        approved_by: userId,
        approved_at: new Date(),
        rejection_reason: reason.trim(),
        notes: rental.notes
          ? `${rental.notes}\n\nRechazada por ${userName}: ${reason}`
          : `Rechazada por ${userName}: ${reason}`
      });

      // Crear alerta de rechazo para el creador
      await Alert.create({
        alertType: 'rental_rejected',
        severity: 'critical',
        title: `Renta rechazada: ${rental.rental_code}`,
        message: `Tu renta ${rental.rental_code} ha sido rechazada por ${userName}. Razón: ${reason}`,
        entityType: 'rental',
        entityId: rental.id.toString(),
        assignedTo: rental.created_by,
        metadata: JSON.stringify({
          rentalCode: rental.rental_code,
          rejectedBy: userId,
          rejectedByName: userName,
          rejectionReason: reason,
          rejectedAt: new Date()
        })
      });

      // Resolver la alerta de pendiente
      await Alert.update(
        {
          isResolved: true,
          resolvedBy: userId,
          resolvedAt: new Date()
        },
        {
          where: {
            entityType: 'rental',
            entityId: rental.id.toString(),
            alertType: 'rental_pending_approval',
            isResolved: false
          }
        }
      );

      console.log(`[RENTAL] Renta ${rental.rental_code} RECHAZADA por usuario ${userId}. Razón: ${reason}`);

      res.json({
        success: true,
        message: 'Renta rechazada',
        data: rental
      });

    } catch (error) {
      console.error('[RENTAL] Error rechazando renta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al rechazar renta'
      });
    }
  }
}
