import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Op } from 'sequelize';
import Lead, { LeadStatus, LeadSource, LeadPriority, LEAD_STATUS_TRANSITIONS } from '../models/Lead';
import LeadActivity, { ActivityType } from '../models/LeadActivity';
import Customer from '../models/Customer';
import User from '../models/User';
import { CodeGenerator } from '../services/codeGenerator';
import { WebSocketService } from '../services/websocketService';
import logger from '../config/logger';
import { createAuditLog, getClientIp } from '../utils/auditLogger';

/**
 * Controlador de Prospectos (Leads)
 * Maneja CRUD, pipeline de status, actividades y conversion a cliente
 */
export class LeadController {

  /**
   * GET /api/leads
   * Listar prospectos con filtros y paginacion
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        status,
        source,
        priority,
        assigned_to,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const where: any = {};

      if (status) where.status = status;
      if (source) where.source = source;
      if (priority) where.priority = priority;
      if (assigned_to) where.assignedTo = assigned_to;

      if (search) {
        where[Op.or] = [
          { leadCode: { [Op.iLike]: `%${search as string}%` } },
          { name: { [Op.iLike]: `%${search as string}%` } },
          { company: { [Op.iLike]: `%${search as string}%` } },
          { email: { [Op.iLike]: `%${search as string}%` } },
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: leads } = await Lead.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'company_name'] },
          { model: User, as: 'assignee', attributes: ['id', 'first_name', 'last_name'] },
          { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        ],
      });

      res.json({
        success: true,
        data: {
          leads,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error obteniendo prospectos', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener prospectos',
      });
    }
  }

  /**
   * GET /api/leads/statistics
   * Estadisticas del pipeline de ventas
   */
  static async getStatistics(req: Request, res: Response) {
    try {
      const leads = await Lead.findAll({
        attributes: ['status', 'source', 'estimatedValue'],
        raw: true,
      });

      // Pipeline counts por status
      const pipeline: Record<string, number> = {};
      Object.values(LeadStatus).forEach(s => { pipeline[s] = 0; });

      // Breakdown por source
      const bySource: Record<string, number> = {};
      Object.values(LeadSource).forEach(s => { bySource[s] = 0; });

      let totalValue = 0;
      let wonCount = 0;
      let totalFinished = 0;

      leads.forEach((lead: any) => {
        pipeline[lead.status] = (pipeline[lead.status] || 0) + 1;
        bySource[lead.source] = (bySource[lead.source] || 0) + 1;

        if (lead.status !== LeadStatus.LOST) {
          totalValue += Number(lead.estimatedValue) || 0;
        }
        if (lead.status === LeadStatus.WON) wonCount++;
        if (lead.status === LeadStatus.WON || lead.status === LeadStatus.LOST) totalFinished++;
      });

      const conversionRate = totalFinished > 0 ? Math.round((wonCount / totalFinished) * 100) : 0;

      res.json({
        success: true,
        data: {
          pipeline,
          bySource,
          totalValue,
          conversionRate,
          totalLeads: leads.length,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo estadisticas de prospectos', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadisticas de prospectos',
      });
    }
  }

  /**
   * GET /api/leads/:id
   * Obtener prospecto por ID con relaciones
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const lead = await Lead.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'assignee', attributes: ['id', 'first_name', 'last_name', 'email'] },
          { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
          {
            model: LeadActivity,
            as: 'activities',
            include: [
              { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
            ],
            order: [['created_at', 'DESC']],
          },
        ],
      });

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Prospecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      logger.error('Error obteniendo prospecto', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener prospecto',
      });
    }
  }

  /**
   * POST /api/leads
   * Crear nuevo prospecto
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        company,
        email,
        phone,
        source,
        priority,
        estimatedValue,
        assignedTo,
        nextFollowUp,
        notes,
      } = req.body;

      const userId = req.user!.id;
      const leadCode = await CodeGenerator.generateLeadCode();

      const lead = await Lead.create({
        leadCode,
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        source: source || LeadSource.OTHER,
        priority: priority || LeadPriority.MEDIUM,
        estimatedValue: estimatedValue || 0,
        assignedTo: assignedTo || null,
        nextFollowUp: nextFollowUp || null,
        notes: notes || null,
        createdBy: userId,
      });

      logger.info(`Prospecto ${leadCode} creado`, { userId });

      createAuditLog({
        userId,
        entityType: 'lead',
        entityId: lead.id,
        action: 'create',
        newValues: { lead_code: leadCode, name, source, priority },
        ipAddress: getClientIp(req),
      });

      WebSocketService.notifyLeadCreated(lead);

      res.status(201).json({
        success: true,
        message: 'Prospecto creado exitosamente',
        data: lead,
      });
    } catch (error) {
      logger.error('Error creando prospecto', { error });
      res.status(500).json({
        success: false,
        message: 'Error al crear prospecto',
      });
    }
  }

  /**
   * PUT /api/leads/:id
   * Actualizar prospecto (solo si no es won/lost)
   */
  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Prospecto no encontrado',
        });
      }

      if (lead.status === LeadStatus.WON || lead.status === LeadStatus.LOST) {
        return res.status(400).json({
          success: false,
          message: 'No se puede editar un prospecto cerrado (ganado o perdido)',
        });
      }

      const oldValues = {
        name: lead.name,
        priority: lead.priority,
        estimatedValue: lead.estimatedValue,
        assignedTo: lead.assignedTo,
      };

      await lead.update(updates);

      const userId = req.user!.id;
      createAuditLog({
        userId,
        entityType: 'lead',
        entityId: Number(id),
        action: 'update',
        oldValues,
        newValues: updates,
        ipAddress: getClientIp(req),
      });

      res.json({
        success: true,
        message: 'Prospecto actualizado exitosamente',
        data: lead,
      });
    } catch (error) {
      logger.error('Error actualizando prospecto', { error });
      res.status(500).json({
        success: false,
        message: 'Error al actualizar prospecto',
      });
    }
  }

  /**
   * DELETE /api/leads/:id
   * Eliminar prospecto (solo si status=new)
   */
  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Prospecto no encontrado',
        });
      }

      if (lead.status !== LeadStatus.NEW) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar prospectos en estado "nuevo"',
        });
      }

      const leadCode = lead.leadCode;
      await lead.destroy();

      const userId = req.user!.id;
      createAuditLog({
        userId,
        entityType: 'lead',
        entityId: Number(id),
        action: 'delete',
        oldValues: { lead_code: leadCode, name: lead.name },
        ipAddress: getClientIp(req),
      });

      res.json({
        success: true,
        message: 'Prospecto eliminado exitosamente',
      });
    } catch (error) {
      logger.error('Error eliminando prospecto', { error });
      res.status(500).json({
        success: false,
        message: 'Error al eliminar prospecto',
      });
    }
  }

  /**
   * PATCH /api/leads/:id/status
   * Cambiar status del prospecto validando transiciones del pipeline
   */
  static async changeStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status: newStatus, lostReason } = req.body;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Prospecto no encontrado',
        });
      }

      // Validar transicion de pipeline
      const allowedTransitions = LEAD_STATUS_TRANSITIONS[lead.status as LeadStatus];
      if (!allowedTransitions || !allowedTransitions.includes(newStatus as LeadStatus)) {
        return res.status(400).json({
          success: false,
          message: `No se puede cambiar de "${lead.status}" a "${newStatus}". Transiciones permitidas: ${allowedTransitions?.join(', ') || 'ninguna'}`,
        });
      }

      // Si es "lost", requiere razon
      if (newStatus === LeadStatus.LOST && !lostReason) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere una razon para marcar el prospecto como perdido',
        });
      }

      const previousStatus = lead.status;
      const updateData: any = { status: newStatus };

      if (newStatus === LeadStatus.LOST) {
        updateData.lostReason = lostReason;
      }
      if (newStatus === LeadStatus.WON) {
        updateData.convertedAt = new Date();
      }

      await lead.update(updateData);

      const userId = req.user!.id;
      createAuditLog({
        userId,
        entityType: 'lead',
        entityId: Number(id),
        action: 'update',
        oldValues: { status: previousStatus },
        newValues: { status: newStatus, lostReason: lostReason || null },
        ipAddress: getClientIp(req),
      });

      WebSocketService.notifyLeadStatusChanged(lead, newStatus);

      res.json({
        success: true,
        message: `Estado del prospecto cambiado a "${newStatus}"`,
        data: lead,
      });
    } catch (error) {
      logger.error('Error cambiando status del prospecto', { error });
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del prospecto',
      });
    }
  }

  /**
   * POST /api/leads/:id/convert
   * Convertir prospecto ganado a cliente
   */
  static async convertToCustomer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { createQuote } = req.body;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Prospecto no encontrado',
        });
      }

      if (lead.status !== LeadStatus.WON) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden convertir prospectos con estado "ganado"',
        });
      }

      if (lead.customerId) {
        return res.status(400).json({
          success: false,
          message: 'Este prospecto ya fue convertido a cliente',
        });
      }

      const userId = req.user!.id;

      // Crear cliente con datos del lead
      const nameParts = lead.name.trim().split(' ');
      const firstName = nameParts[0] || lead.name;
      const lastName = nameParts.slice(1).join(' ') || '';

      const customer = await Customer.create({
        first_name: firstName,
        last_name: lastName || firstName,
        email: lead.email || `${lead.leadCode.toLowerCase()}@pendiente.com`,
        phone: lead.phone || null,
        company_name: lead.company || null,
        customer_type: lead.company ? 'corporate' : 'individual',
        is_active: true,
        notes: `Convertido desde prospecto ${lead.leadCode}${lead.notes ? '\n' + lead.notes : ''}`,
      } as any);

      // Actualizar lead con referencia al customer
      await lead.update({ customerId: customer.id });

      createAuditLog({
        userId,
        entityType: 'lead',
        entityId: Number(id),
        action: 'update',
        oldValues: { customerId: null },
        newValues: { customerId: customer.id, action: 'converted_to_customer' },
        ipAddress: getClientIp(req),
      });

      // Opcionalmente crear cotizacion draft
      let quote = null;
      if (createQuote) {
        const Quote = (await import('../models/Quote')).default;
        const quoteCode = await CodeGenerator.generateQuoteCode();
        quote = await Quote.create({
          quote_code: quoteCode,
          customer_id: customer.id,
          status: 'draft',
          total_amount: lead.estimatedValue || 0,
          subtotal: lead.estimatedValue || 0,
          tax_percentage: 16,
          tax_amount: 0,
          discount_percentage: 0,
          discount_amount: 0,
          insurance_amount: 0,
          extras_amount: 0,
          shipping_cost: 0,
          deposit_amount: 0,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: `Generada desde prospecto ${lead.leadCode}`,
          created_by: userId,
        } as any);
      }

      WebSocketService.notifyLeadConverted(lead, customer.id);

      logger.info(`Prospecto ${lead.leadCode} convertido a cliente #${customer.id}`);

      res.status(201).json({
        success: true,
        message: `Prospecto convertido a cliente exitosamente${quote ? ' con cotizacion borrador' : ''}`,
        data: {
          lead,
          customer,
          quote,
        },
      });
    } catch (error) {
      logger.error('Error convirtiendo prospecto a cliente', { error });
      res.status(500).json({
        success: false,
        message: 'Error al convertir prospecto a cliente',
      });
    }
  }

  /**
   * GET /api/leads/:id/activities
   * Listar actividades de un prospecto
   */
  static async getActivities(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Prospecto no encontrado',
        });
      }

      const activities = await LeadActivity.findAll({
        where: { leadId: Number(id) },
        include: [
          { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      logger.error('Error obteniendo actividades del prospecto', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener actividades del prospecto',
      });
    }
  }

  /**
   * POST /api/leads/:id/activities
   * Agregar actividad al prospecto
   */
  static async addActivity(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { activityType, description, scheduledAt } = req.body;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Prospecto no encontrado',
        });
      }

      const userId = req.user!.id;

      const activity = await LeadActivity.create({
        leadId: Number(id),
        activityType,
        description,
        scheduledAt: scheduledAt || null,
        createdBy: userId,
      });

      // Si es follow_up con fecha, actualizar nextFollowUp del lead
      if (activityType === ActivityType.FOLLOW_UP && scheduledAt) {
        await lead.update({ nextFollowUp: new Date(scheduledAt) });
      }

      createAuditLog({
        userId,
        entityType: 'lead',
        entityId: Number(id),
        action: 'update',
        newValues: { activity_added: activityType, description },
        ipAddress: getClientIp(req),
      });

      res.status(201).json({
        success: true,
        message: 'Actividad agregada exitosamente',
        data: activity,
      });
    } catch (error) {
      logger.error('Error agregando actividad al prospecto', { error });
      res.status(500).json({
        success: false,
        message: 'Error al agregar actividad al prospecto',
      });
    }
  }

  /**
   * PATCH /api/leads/:id/activities/:activityId/complete
   * Marcar actividad como completada
   */
  static async completeActivity(req: AuthRequest, res: Response) {
    try {
      const { id, activityId } = req.params;

      const activity = await LeadActivity.findOne({
        where: { id: Number(activityId), leadId: Number(id) },
      });

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
      }

      if (activity.completedAt) {
        return res.status(400).json({
          success: false,
          message: 'La actividad ya fue completada',
        });
      }

      await activity.update({ completedAt: new Date() });

      const userId = req.user!.id;
      createAuditLog({
        userId,
        entityType: 'lead',
        entityId: Number(id),
        action: 'update',
        newValues: { activity_completed: Number(activityId) },
        ipAddress: getClientIp(req),
      });

      res.json({
        success: true,
        message: 'Actividad completada exitosamente',
        data: activity,
      });
    } catch (error) {
      logger.error('Error completando actividad', { error });
      res.status(500).json({
        success: false,
        message: 'Error al completar actividad',
      });
    }
  }
}
