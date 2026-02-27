import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Op } from 'sequelize';
import fs from 'fs';
import Quote from '../models/Quote';
import { QuoteStatus } from '../models/Quote';
import Vehicle from '../models/Vehicle';
import Customer from '../models/Customer';
import Location from '../models/Location';
import Rental from '../models/Rental';
import User from '../models/User';
import { RentalStatus } from '../models/Rental';
import { RentalCalculator } from '../services/rentalCalculator';
import { CodeGenerator } from '../services/codeGenerator';
import { RentalCascadeService } from '../services/rentalCascade';
import { PDFService } from '../services/pdfService';
import { EmailService } from '../services/emailService';
import { WebSocketService } from '../services/websocketService';
import logger from '../config/logger';
import { createAuditLog, getClientIp } from '../utils/auditLogger';
import { DocumentRegistrationService } from '../services/documentRegistrationService';

/**
 * Controlador de Cotizaciones
 * Maneja CRUD, envío, aceptación, rechazo y conversión a renta
 */
export class QuoteController {

  /**
   * GET /api/quotes
   * Listar cotizaciones con filtros
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        status,
        customer_id,
        vehicle_id,
        search,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (status) where.status = status;
      if (customer_id) where.customer_id = customer_id;
      if (vehicle_id) where.vehicle_id = vehicle_id;

      if (search) {
        where[Op.or] = [
          { quote_code: { [Op.iLike]: `%${search as string}%` } }
        ];
      }
      if (startDate) {
        where.created_at = { ...(where.created_at || {}), [Op.gte]: new Date(startDate as string) };
      }
      if (endDate) {
        where.created_at = { ...(where.created_at || {}), [Op.lte]: new Date(endDate as string) };
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: quotes } = await Quote.findAndCountAll({
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
          quotes,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo cotizaciones', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener cotizaciones'
      });
    }
  }

  /**
   * GET /api/quotes/:id
   * Obtener cotización por ID con relaciones
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' },
          { model: Location, as: 'location' },
          { model: Rental, as: 'convertedRental' },
          { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ]
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      res.json({
        success: true,
        data: quote
      });
    } catch (error) {
      logger.error('Error obteniendo cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener cotización'
      });
    }
  }

  /**
   * POST /api/quotes
   * Crear nueva cotización con cálculos automáticos
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      const {
        customer_id,
        vehicle_id,
        location_id,
        start_date,
        end_date,
        daily_rate,
        tax_percentage,
        discount_percentage,
        insurance_amount,
        extras_amount,
        shipping_cost,
        deposit_amount,
        valid_days,
        notes
      } = req.body;

      // Validar cliente
      if (!customer_id) {
        return res.status(400).json({
          success: false,
          message: 'El cliente es requerido'
        });
      }

      const customer = await Customer.findByPk(customer_id);
      if (!customer || !customer.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cliente no encontrado o inactivo'
        });
      }

      // Si se proporciona vehículo, validar
      let vehicle: Vehicle | null = null;
      let finalDailyRate = daily_rate || 0;

      if (vehicle_id) {
        vehicle = await Vehicle.findByPk(vehicle_id);
        if (!vehicle || !vehicle.is_active) {
          return res.status(400).json({
            success: false,
            message: 'Vehículo no encontrado o inactivo'
          });
        }
        finalDailyRate = daily_rate || vehicle.daily_rate;
      }

      // Validar rango de fechas si ambas están presentes
      if (start_date && end_date) {
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
          });
        }
      }

      // Calcular montos si hay fechas y tarifa
      let calculation = {
        days: 0,
        daily_rate: finalDailyRate,
        subtotal: 0,
        tax_percentage: tax_percentage ?? 16,
        tax_amount: 0,
        discount_percentage: discount_percentage ?? 0,
        discount_amount: 0,
        insurance_amount: insurance_amount ?? 0,
        extras_amount: extras_amount ?? 0,
        shipping_cost: shipping_cost ?? 0,
        price_adjustment: 0,
        total_amount: 0
      };

      if (start_date && end_date && finalDailyRate > 0) {
        calculation = RentalCalculator.calculate({
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          daily_rate: finalDailyRate,
          tax_percentage,
          discount_percentage,
          insurance_amount,
          extras_amount,
          shipping_cost
        });
      }

      // Generar código y calcular vigencia
      const quoteCode = await CodeGenerator.generateQuoteCode();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (valid_days || 30));

      const userId = req.user!.id;

      const quote = await Quote.create({
        quote_code: quoteCode,
        customer_id,
        vehicle_id: vehicle_id || null,
        location_id: location_id || null,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        days: calculation.days || undefined,
        daily_rate: calculation.daily_rate || undefined,
        subtotal: calculation.subtotal,
        discount_percentage: calculation.discount_percentage,
        discount_amount: calculation.discount_amount,
        insurance_amount: calculation.insurance_amount,
        extras_amount: calculation.extras_amount,
        shipping_cost: calculation.shipping_cost,
        tax_percentage: calculation.tax_percentage,
        tax_amount: calculation.tax_amount,
        total_amount: calculation.total_amount,
        deposit_amount: deposit_amount || 0,
        status: QuoteStatus.DRAFT,
        valid_until: validUntil,
        notes,
        created_by: userId
      });

      logger.info(`Cotización ${quoteCode} creada`, { userId });

      createAuditLog({
        userId,
        entityType: 'quote',
        entityId: quote.id,
        action: 'create',
        newValues: { quote_code: quoteCode, customer_id, vehicle_id, total_amount: quote.total_amount },
        ipAddress: getClientIp(req),
      });

      res.status(201).json({
        success: true,
        message: 'Cotización creada exitosamente',
        data: quote
      });
    } catch (error) {
      logger.error('Error creando cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al crear cotización'
      });
    }
  }

  /**
   * PUT /api/quotes/:id
   * Actualizar cotización (solo si status=draft)
   */
  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const quote = await Quote.findByPk(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      if (quote.status !== QuoteStatus.DRAFT) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden editar cotizaciones en borrador'
        });
      }

      // Validar rango de fechas si se proporcionan
      const effectiveStart = new Date(updates.start_date || quote.start_date!);
      const effectiveEnd = new Date(updates.end_date || quote.end_date!);
      if ((updates.start_date || updates.end_date) && effectiveEnd <= effectiveStart) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      // Recalcular si cambian datos financieros
      const needsRecalculation = updates.start_date || updates.end_date ||
        updates.daily_rate !== undefined || updates.discount_percentage !== undefined ||
        updates.insurance_amount !== undefined || updates.extras_amount !== undefined ||
        updates.shipping_cost !== undefined || updates.vehicle_id;

      if (needsRecalculation) {
        // Si cambió el vehículo, obtener nueva tarifa
        let dailyRate = updates.daily_rate ?? quote.daily_rate;
        if (updates.vehicle_id && updates.vehicle_id !== quote.vehicle_id) {
          const vehicle = await Vehicle.findByPk(updates.vehicle_id);
          if (vehicle) {
            dailyRate = updates.daily_rate || vehicle.daily_rate;
          }
        }

        if (dailyRate && dailyRate > 0 && (updates.start_date || quote.start_date)) {
          const calculation = RentalCalculator.calculate({
            start_date: effectiveStart,
            end_date: effectiveEnd,
            daily_rate: dailyRate,
            tax_percentage: updates.tax_percentage ?? quote.tax_percentage,
            discount_percentage: updates.discount_percentage ?? quote.discount_percentage,
            insurance_amount: updates.insurance_amount ?? quote.insurance_amount,
            extras_amount: updates.extras_amount ?? quote.extras_amount,
            shipping_cost: updates.shipping_cost ?? quote.shipping_cost
          });

          Object.assign(updates, {
            days: calculation.days,
            daily_rate: calculation.daily_rate,
            subtotal: calculation.subtotal,
            tax_amount: calculation.tax_amount,
            discount_amount: calculation.discount_amount,
            total_amount: calculation.total_amount,
            shipping_cost: calculation.shipping_cost
          });
        }
      }

      const oldValues = { status: quote.status, total_amount: quote.total_amount };
      updates.updated_at = new Date();
      await quote.update(updates);

      const userId = req.user!.id;
      if (userId) {
        createAuditLog({
          userId,
          entityType: 'quote',
          entityId: Number(id),
          action: 'update',
          oldValues,
          newValues: updates,
          ipAddress: getClientIp(req),
        });
      }

      res.json({
        success: true,
        message: 'Cotización actualizada exitosamente',
        data: quote
      });
    } catch (error) {
      logger.error('Error actualizando cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cotización'
      });
    }
  }

  /**
   * DELETE /api/quotes/:id
   * Eliminar cotización (solo si status=draft)
   */
  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      if (quote.status !== QuoteStatus.DRAFT) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar cotizaciones en borrador'
        });
      }

      const quoteCode = quote.quote_code;
      await quote.destroy();

      const userId = req.user!.id;
      if (userId) {
        createAuditLog({
          userId,
          entityType: 'quote',
          entityId: Number(id),
          action: 'delete',
          oldValues: { quote_code: quoteCode, customer_id: quote.customer_id },
          ipAddress: getClientIp(req),
        });
      }

      res.json({
        success: true,
        message: 'Cotización eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al eliminar cotización'
      });
    }
  }

  /**
   * PATCH /api/quotes/:id/send
   * Enviar cotización al cliente (draft → sent)
   */
  static async send(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      if (quote.status !== QuoteStatus.DRAFT) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden enviar cotizaciones en borrador'
        });
      }

      // Validar que tenga datos mínimos para enviar
      if (!quote.customer_id || !quote.total_amount || quote.total_amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cotización debe tener un cliente y un monto total válido para ser enviada'
        });
      }

      await quote.update({
        status: QuoteStatus.SENT,
        updated_at: new Date()
      });

      const userId = req.user!.id;
      if (userId) {
        createAuditLog({
          userId,
          entityType: 'quote',
          entityId: Number(id),
          action: 'update',
          oldValues: { status: QuoteStatus.DRAFT },
          newValues: { status: QuoteStatus.SENT },
          ipAddress: getClientIp(req),
        });
      }

      // Generar PDF (best effort — no bloquea si falla)
      try {
        const pdfPath = await PDFService.generateQuote(quote);
        await quote.update({ pdf_url: pdfPath });
        logger.info(`PDF generado para cotización`, { pdfPath });
      } catch (pdfError) {
        logger.warn('Error generando PDF (no bloqueante)', { error: pdfError });
      }

      // Enviar email con PDF adjunto (best effort)
      const customer = quote.get('customer') as Customer;
      if (customer?.email && quote.pdf_url) {
        try {
          await EmailService.sendQuote(customer, quote, quote.pdf_url);
        } catch (emailError) {
          logger.warn('Error enviando email (no bloqueante)', { error: emailError });
        }
      }

      // Notificación WebSocket
      WebSocketService.notifyQuoteStatusChanged(quote, 'sent');

      logger.info(`Cotización ${quote.quote_code} enviada`);

      res.json({
        success: true,
        message: 'Cotización enviada exitosamente',
        data: quote
      });
    } catch (error) {
      logger.error('Error enviando cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al enviar cotización'
      });
    }
  }

  /**
   * PATCH /api/quotes/:id/accept
   * Marcar cotización como aceptada
   */
  static async accept(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      if (quote.status !== QuoteStatus.SENT) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aceptar cotizaciones enviadas'
        });
      }

      // Verificar que no esté vencida
      if (new Date() > new Date(quote.valid_until)) {
        await quote.update({ status: QuoteStatus.EXPIRED, updated_at: new Date() });
        return res.status(400).json({
          success: false,
          message: 'La cotización ha expirado'
        });
      }

      await quote.update({
        status: QuoteStatus.ACCEPTED,
        updated_at: new Date()
      });

      WebSocketService.notifyQuoteStatusChanged(quote, 'accepted');
      logger.info(`Cotización ${quote.quote_code} aceptada`);

      const userId = req.user!.id;
      if (userId) {
        createAuditLog({
          userId,
          entityType: 'quote',
          entityId: Number(id),
          action: 'update',
          oldValues: { status: QuoteStatus.SENT },
          newValues: { status: QuoteStatus.ACCEPTED },
          ipAddress: getClientIp(req),
        });
      }

      res.json({
        success: true,
        message: 'Cotización aceptada exitosamente',
        data: quote
      });
    } catch (error) {
      logger.error('Error aceptando cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al aceptar cotización'
      });
    }
  }

  /**
   * PATCH /api/quotes/:id/reject
   * Marcar cotización como rechazada
   */
  static async reject(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const quote = await Quote.findByPk(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      if (quote.status !== QuoteStatus.SENT && quote.status !== QuoteStatus.ACCEPTED) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden rechazar cotizaciones enviadas o aceptadas'
        });
      }

      const previousStatus = quote.status;
      await quote.update({
        status: QuoteStatus.REJECTED,
        customer_notes: reason || null,
        updated_at: new Date()
      });
      WebSocketService.notifyQuoteStatusChanged(quote, 'rejected');
      logger.info(`Cotización ${quote.quote_code} rechazada`, { reason: reason || 'N/A' });

      const userId = req.user!.id;
      if (userId) {
        createAuditLog({
          userId,
          entityType: 'quote',
          entityId: Number(id),
          action: 'update',
          oldValues: { status: previousStatus },
          newValues: { status: QuoteStatus.REJECTED, reason },
          ipAddress: getClientIp(req),
        });
      }

      res.json({
        success: true,
        message: 'Cotización rechazada',
        data: quote
      });
    } catch (error) {
      logger.error('Error rechazando cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al rechazar cotización'
      });
    }
  }

  /**
   * POST /api/quotes/:id/convert
   * Convertir cotización aceptada a renta
   */
  static async convertToRental(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const quote = await Quote.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' }
        ]
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      if (quote.status !== QuoteStatus.ACCEPTED) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden convertir cotizaciones aceptadas'
        });
      }

      // Validar campos requeridos para crear renta
      if (!quote.vehicle_id || !quote.start_date || !quote.end_date || !quote.location_id || !quote.days || !quote.daily_rate) {
        return res.status(400).json({
          success: false,
          message: 'La cotización debe tener vehículo, fechas, ubicación, días y tarifa para ser convertida a renta'
        });
      }

      // Verificar que el vehículo sigue disponible
      const vehicle = await Vehicle.findByPk(quote.vehicle_id);
      if (!vehicle || vehicle.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'El vehículo ya no está disponible'
        });
      }

      // Crear la renta con los datos de la cotización
      const rentalCode = await CodeGenerator.generateRentalCode();

      const rental = await Rental.create({
        rental_code: rentalCode,
        customer_id: quote.customer_id,
        vehicle_id: quote.vehicle_id,
        location_id: quote.location_id!,
        return_location_id: quote.location_id!,
        start_date: quote.start_date,
        end_date: quote.end_date,
        days: quote.days!,
        daily_rate: Number(quote.daily_rate),
        subtotal: Number(quote.subtotal),
        tax_percentage: Number(quote.tax_percentage),
        tax_amount: Number(quote.tax_amount),
        discount_percentage: Number(quote.discount_percentage) || 0,
        discount_amount: Number(quote.discount_amount) || 0,
        insurance_amount: Number(quote.insurance_amount) || 0,
        extras_amount: Number(quote.extras_amount) || 0,
        shipping_cost: Number(quote.shipping_cost) || 0,
        total_amount: Number(quote.total_amount),
        deposit_amount: Number(quote.deposit_amount) || 0,
        status: RentalStatus.ACTIVE,
        created_by: userId,
        start_mileage: vehicle.mileage,
        fuel_level_start: 'full',
        notes: `Convertida desde cotización ${quote.quote_code}${quote.notes ? '\n' + quote.notes : ''}`
      });

      // Marcar cotización como convertida
      await quote.update({
        status: QuoteStatus.CONVERTED,
        converted_rental_id: rental.id,
        updated_at: new Date()
      });

      // Ejecutar cascadas de la renta (marcar vehículo como rentado, etc.)
      RentalCascadeService.onRentalCreated(rental, userId)
        .catch(error => {
          logger.error('Error en cascadas de renta (post-conversión)', { error });
        });

      WebSocketService.notifyQuoteStatusChanged(quote, 'converted');
      logger.info(`Cotización ${quote.quote_code} convertida a renta ${rentalCode}`);

      if (userId) {
        createAuditLog({
          userId,
          entityType: 'quote',
          entityId: Number(id),
          action: 'update',
          oldValues: { status: QuoteStatus.ACCEPTED },
          newValues: { status: QuoteStatus.CONVERTED, rental_code: rentalCode },
          ipAddress: getClientIp(req),
        });
      }

      res.status(201).json({
        success: true,
        message: `Cotización convertida a renta ${rentalCode} exitosamente`,
        data: {
          quote,
          rental
        }
      });
    } catch (error) {
      logger.error('Error convirtiendo cotización a renta', { error });
      res.status(500).json({
        success: false,
        message: 'Error al convertir cotización a renta'
      });
    }
  }

  /**
   * GET /api/quotes/:id/pdf
   * Descargar PDF de cotización (genera si no existe)
   */
  static async downloadPDF(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      // Si no tiene PDF o el archivo no existe, generarlo
      let pdfPath = quote.pdf_url;
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        pdfPath = await PDFService.generateQuote(quote);
        await quote.update({ pdf_url: pdfPath });
      }

      // Fire-and-forget document registration
      DocumentRegistrationService.registerAutoDocument({
        documentType: 'quote',
        name: `Cotización ${quote.quote_code}`,
        filePath: pdfPath,
        entityType: 'quote',
        entityId: quote.id,
      }).catch(() => {});

      res.download(pdfPath, `cotizacion-${quote.quote_code}.pdf`);
    } catch (error) {
      logger.error('Error descargando PDF de cotización', { error });
      res.status(500).json({
        success: false,
        message: 'Error al descargar PDF de cotización'
      });
    }
  }
}
