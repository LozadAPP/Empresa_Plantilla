import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { addDays } from 'date-fns';
import sequelize from '../config/database';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import Rental from '../models/Rental';
import Customer from '../models/Customer';
import Vehicle from '../models/Vehicle';
import { PaymentStatus, PaymentType } from '../models/Payment';
import { InvoiceStatus } from '../models/Invoice';
import { CodeGenerator } from '../services/codeGenerator';
import { PDFService } from '../services/pdfService';
import { EmailService } from '../services/emailService';
import logger from '../config/logger';
import { DocumentRegistrationService } from '../services/documentRegistrationService';
import InvoiceLineItem from '../models/InvoiceLineItem';
import cfdiService from '../services/cfdiService';

/**
 * Controlador de Pagos y Facturas
 * Maneja el registro de pagos, generación y envío de facturas
 */
export class PaymentController {

  /**
   * GET /api/payments
   * Obtener todos los pagos
   */
  static async getAllPayments(req: Request, res: Response) {
    try {
      const {
        customer_id,
        rental_id,
        location_id,
        status,
        payment_type,
        payment_method,
        search,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (customer_id) where.customer_id = customer_id;
      if (rental_id) where.rental_id = rental_id;
      if (status) where.status = status;
      if (payment_type) where.payment_type = payment_type;
      if (payment_method) where.payment_method = payment_method;
      if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) dateFilter[Op.gte] = new Date(startDate as string);
        if (endDate) dateFilter[Op.lte] = new Date(endDate as string);
        where.transaction_date = dateFilter;
      }

      // Búsqueda por texto
      if (search && typeof search === 'string') {
        const searchTerm = `%${search}%`;
        where[Op.or] = [
          { payment_code: { [Op.iLike]: searchTerm } },
          { reference_number: { [Op.iLike]: searchTerm } },
          { '$customer.name$': { [Op.iLike]: searchTerm } },
          { '$rental.rental_code$': { [Op.iLike]: searchTerm } }
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);

      // Build rental include with optional location filter
      const rentalInclude: any = { model: Rental, as: 'rental' };
      if (location_id) {
        rentalInclude.where = { location_id: Number(location_id) };
        rentalInclude.required = true;
      }

      const { count, rows: payments } = await Payment.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer' },
          rentalInclude
        ],
        subQuery: false
      });

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('[PAYMENT] Error obteniendo pagos', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener pagos',
      });
    }
  }

  /**
   * GET /api/payments/:id
   * Obtener un pago por ID
   */
  static async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Rental, as: 'rental' },
          { model: Invoice, as: 'invoice' }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      logger.error('[PAYMENT] Error obteniendo pago', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener pago',
      });
    }
  }

  /**
   * POST /api/payments
   * Registrar un nuevo pago
   */
  static async createPayment(req: AuthRequest, res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const {
        rental_id,
        invoice_id,
        customer_id,
        amount,
        payment_method,
        payment_type,
        reference_number,
        transaction_date,
        notes
      } = req.body;

      // Validaciones
      if (!customer_id || !amount || !payment_method || !payment_type) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: customer_id, amount, payment_method, payment_type'
        });
      }

      if (amount <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }

      // Verificar que el cliente existe
      const customer = await Customer.findByPk(customer_id, { transaction });
      if (!customer) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Generar código de pago
      const paymentCode = await CodeGenerator.generatePaymentCode();

      // Determinar status según método de pago
      // Efectivo y tarjetas = confirmado inmediatamente
      // Transferencia y cheque = pendiente de verificación
      const immediatePaymentMethods = ['cash', 'credit_card', 'debit_card'];
      const paymentStatus = immediatePaymentMethods.includes(payment_method)
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PENDING;

      // Crear el pago
      const payment = await Payment.create({
        payment_code: paymentCode,
        rental_id,
        invoice_id,
        customer_id,
        amount,
        payment_method,
        payment_type: payment_type as PaymentType,
        status: paymentStatus,
        reference_number,
        transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
        notes,
        processed_by: req.user?.id
      }, { transaction });

      // Solo actualizar balances si el pago está completado
      if (paymentStatus === PaymentStatus.COMPLETED) {
        // Si hay factura asociada, actualizar balance
        if (invoice_id) {
          const invoice = await Invoice.findByPk(invoice_id, { transaction });
          if (invoice) {
            const newPaidAmount = Math.min(
              (invoice.paid_amount || 0) + amount,
              invoice.total_amount
            );
            const newBalance = Math.max(0, invoice.total_amount - newPaidAmount);

            await invoice.update({
              paid_amount: newPaidAmount,
              balance: newBalance,
              status: newBalance <= 0 ? InvoiceStatus.PAID : invoice.status,
              updated_at: new Date()
            }, { transaction });
          }
        }

        // Actualizar balance del cliente
        const newCustomerBalance = (customer.current_balance || 0) - amount;
        await customer.update({
          current_balance: Math.max(0, newCustomerBalance)
        }, { transaction });
      }

      // Commit de la transacción
      await transaction.commit();

      const statusMessage = paymentStatus === PaymentStatus.COMPLETED
        ? 'Pago registrado y confirmado exitosamente'
        : 'Pago registrado como pendiente de confirmación';

      res.status(201).json({
        success: true,
        message: statusMessage,
        data: payment
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('[PAYMENT] Error registrando pago', { error });
      res.status(500).json({
        success: false,
        message: 'Error al registrar pago',
      });
    }
  }

  /**
   * PATCH /api/payments/:id/confirm
   * Confirmar un pago pendiente (transferencia/cheque verificado)
   */
  static async confirmPayment(req: Request, res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id, { transaction });
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Pago no encontrado' });
      }

      if (payment.status !== PaymentStatus.PENDING) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Solo se pueden confirmar pagos pendientes. Estado actual: ${payment.status}`
        });
      }

      // Marcar como completado
      await payment.update({ status: PaymentStatus.COMPLETED }, { transaction });

      // Ahora actualizar balances (factura y cliente)
      if (payment.invoice_id) {
        const invoice = await Invoice.findByPk(payment.invoice_id, { transaction });
        if (invoice) {
          const newPaidAmount = Math.min(
            (invoice.paid_amount || 0) + Number(payment.amount),
            invoice.total_amount
          );
          const newBalance = Math.max(0, invoice.total_amount - newPaidAmount);

          await invoice.update({
            paid_amount: newPaidAmount,
            balance: newBalance,
            status: newBalance <= 0 ? InvoiceStatus.PAID : invoice.status,
            updated_at: new Date()
          }, { transaction });
        }
      }

      const customer = await Customer.findByPk(payment.customer_id, { transaction });
      if (customer) {
        const newBalance = (customer.current_balance || 0) - Number(payment.amount);
        await customer.update({ current_balance: Math.max(0, newBalance) }, { transaction });
      }

      await transaction.commit();

      res.json({
        success: true,
        message: 'Pago confirmado exitosamente',
        data: payment
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('[PAYMENT] Error confirmando pago', { error });
      res.status(500).json({ success: false, message: 'Error al confirmar pago' });
    }
  }

  /**
   * PATCH /api/payments/:id/fail
   * Marcar un pago pendiente como fallido
   */
  static async failPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const payment = await Payment.findByPk(id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Pago no encontrado' });
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return res.status(400).json({
          success: false,
          message: `Solo se pueden rechazar pagos pendientes. Estado actual: ${payment.status}`
        });
      }

      await payment.update({
        status: PaymentStatus.FAILED,
        notes: reason ? `${payment.notes || ''} | Rechazado: ${reason}`.trim() : payment.notes
      });

      res.json({
        success: true,
        message: 'Pago marcado como fallido',
        data: payment
      });

    } catch (error) {
      logger.error('[PAYMENT] Error rechazando pago', { error });
      res.status(500).json({ success: false, message: 'Error al rechazar pago' });
    }
  }

  /**
   * GET /api/invoices
   * Obtener todas las facturas
   */
  static async getAllInvoices(req: Request, res: Response) {
    try {
      const {
        customer_id,
        rental_id,
        location_id,
        status,
        cfdi_status,
        search,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (customer_id) where.customer_id = customer_id;
      if (rental_id) where.rental_id = rental_id;
      if (status) where.status = status;
      if (cfdi_status) where.cfdi_status = cfdi_status;
      if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) dateFilter[Op.gte] = new Date(startDate as string);
        if (endDate) dateFilter[Op.lte] = new Date(endDate as string);
        where.issue_date = dateFilter;
      }

      // Búsqueda por texto
      if (search && typeof search === 'string') {
        const searchTerm = `%${search}%`;
        where[Op.or] = [
          { invoice_code: { [Op.iLike]: searchTerm } },
          { '$customer.name$': { [Op.iLike]: searchTerm } },
          { '$customer.email$': { [Op.iLike]: searchTerm } }
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);

      // Build rental include with optional location filter
      const rentalInclude: any = { model: Rental, as: 'rental' };
      if (location_id) {
        rentalInclude.where = { location_id: Number(location_id) };
        rentalInclude.required = true;
      }

      const { count, rows: invoices } = await Invoice.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer' },
          rentalInclude
        ],
        subQuery: false
      });

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('[PAYMENT] Error obteniendo facturas', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener facturas',
      });
    }
  }

  /**
   * GET /api/invoices/:id
   * Obtener una factura por ID
   */
  static async getInvoiceById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Rental, as: 'rental' },
          { model: Payment, as: 'payments' },
          { model: InvoiceLineItem, as: 'lineItems', order: [['sort_order', 'ASC']] }
        ]
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.json({
        success: true,
        data: invoice
      });

    } catch (error) {
      logger.error('[PAYMENT] Error obteniendo factura', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener factura',
      });
    }
  }

  /**
   * POST /api/invoices
   * Crear una nueva factura
   */
  static async createInvoice(req: AuthRequest, res: Response) {
    try {
      const {
        rental_id,
        customer_id,
        due_days = 7,
        notes,
        // CFDI fields (optional)
        uso_cfdi,
        payment_form_code,
        payment_method_code,
        currency_code,
        exchange_rate,
        line_items,
      } = req.body;

      // Validaciones
      if (!rental_id || !customer_id) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: rental_id, customer_id'
        });
      }

      // Verificar que la renta existe
      const rental = await Rental.findByPk(rental_id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Renta no encontrada'
        });
      }

      // Verificar que el cliente existe
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Generar código de factura
      const invoiceCode = await CodeGenerator.generateInvoiceCode();

      // Fechas
      const issueDate = new Date();
      const dueDate = addDays(issueDate, due_days);

      // Crear factura
      const invoice = await Invoice.create({
        invoice_code: invoiceCode,
        rental_id,
        customer_id,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: rental.subtotal,
        tax_amount: rental.tax_amount,
        discount_amount: rental.discount_amount,
        total_amount: rental.total_amount,
        paid_amount: 0,
        balance: rental.total_amount,
        status: InvoiceStatus.SENT,
        notes,
        created_by: req.user?.id,
        // CFDI fields
        uso_cfdi: uso_cfdi || 'G03',
        payment_form_code,
        payment_method_code: payment_method_code || 'PUE',
        currency_code: currency_code || 'MXN',
        exchange_rate: exchange_rate || 1,
        cfdi_status: 'pending_stamp' as any,
      });

      // Generar líneas de detalle
      if (line_items && Array.isArray(line_items) && line_items.length > 0) {
        // Líneas manuales del frontend
        const lineData = line_items.map((item: any, idx: number) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitCode: item.unit_code || 'E48',
          unitPrice: item.unit_price,
          discount: item.discount || 0,
          subtotal: item.subtotal,
          taxRate: item.tax_rate || 16,
          taxAmount: item.tax_amount,
          total: item.total,
          satProductCode: item.sat_product_code || '78111802',
          sortOrder: idx,
        }));
        await InvoiceLineItem.bulkCreate(lineData);
      } else {
        // Auto-generar desde la renta
        await cfdiService.generateLineItemsFromRental(invoice.id, rental_id);
      }

      // Generar PDF de factura
      const pdfUrl = await PDFService.generateInvoice(invoice);
      await invoice.update({ pdf_url: pdfUrl });

      // Enviar factura por email
      await EmailService.sendInvoice(customer, invoice, pdfUrl);

      // Reload with line items
      const created = await Invoice.findByPk(invoice.id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: InvoiceLineItem, as: 'lineItems' },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Factura creada y enviada exitosamente',
        data: created
      });

    } catch (error) {
      logger.error('[PAYMENT] Error creando factura', { error });
      res.status(500).json({
        success: false,
        message: 'Error al crear factura',
      });
    }
  }

  /**
   * POST /api/invoices/:id/send
   * Reenviar factura por email
   */
  static async resendInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      const customer = await Customer.findByPk(invoice.customer_id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Reenviar email
      await EmailService.sendInvoice(customer, invoice, invoice.pdf_url || undefined);

      res.json({
        success: true,
        message: 'Factura reenviada exitosamente'
      });

    } catch (error) {
      logger.error('[PAYMENT] Error reenviando factura', { error });
      res.status(500).json({
        success: false,
        message: 'Error al reenviar factura',
      });
    }
  }

  /**
   * GET /api/invoices/overdue
   * Obtener facturas vencidas
   */
  static async getOverdueInvoices(req: Request, res: Response) {
    try {
      const now = new Date();

      const overdueInvoices = await Invoice.findAll({
        where: {
          due_date: { [Op.lt]: now },
          balance: { [Op.gt]: 0 },
          status: { [Op.ne]: InvoiceStatus.PAID }
        },
        include: [
          { model: Customer, as: 'customer' },
          { model: Rental, as: 'rental' }
        ],
        order: [['due_date', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          total: overdueInvoices.length,
          invoices: overdueInvoices
        }
      });

    } catch (error) {
      logger.error('[PAYMENT] Error obteniendo facturas vencidas', { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener facturas vencidas',
      });
    }
  }

  /**
   * GET /api/invoices/:id/pdf
   * Descargar el PDF de una factura
   */
  static async downloadInvoicePDF(req: Request, res: Response) {
    try {
      const invoice = await Invoice.findByPk(req.params.id, {
        include: [
          { model: Customer, as: 'customer' },
          {
            model: Rental,
            as: 'rental',
            include: [{ model: Vehicle, as: 'vehicle' }]
          }
        ]
      });

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Factura no encontrada' });
      }

      // Path determinístico de la factura
      const pdfPath = path.resolve('storage/pdfs', `invoice-${invoice.invoice_code}.pdf`);

      // Si el archivo no existe, regenerarlo
      if (!fs.existsSync(pdfPath)) {
        try {
          await PDFService.generateInvoice(invoice);
        } catch (pdfError) {
          logger.error('[PAYMENT] Error regenerando factura PDF', { error: pdfError });
          return res.status(500).json({ success: false, message: 'Error al generar factura PDF' });
        }
      }

      // Verificar que el archivo ahora existe
      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ success: false, message: 'Factura PDF no disponible' });
      }

      // Fire-and-forget document registration
      DocumentRegistrationService.registerAutoDocument({
        documentType: 'invoice',
        name: `Factura ${invoice.invoice_code}`,
        filePath: pdfPath,
        entityType: 'invoice',
        entityId: invoice.id,
      }).catch(() => {});

      res.download(pdfPath, `factura-${invoice.invoice_code}.pdf`);
    } catch (error) {
      logger.error('[PAYMENT] Error descargando factura PDF', { error });
      res.status(500).json({ success: false, message: 'Error al descargar factura PDF' });
    }
  }
}
