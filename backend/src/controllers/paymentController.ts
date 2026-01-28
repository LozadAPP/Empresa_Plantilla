import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { addDays } from 'date-fns';
import sequelize from '../config/database';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import Rental from '../models/Rental';
import Customer from '../models/Customer';
import { PaymentStatus, PaymentType } from '../models/Payment';
import { InvoiceStatus } from '../models/Invoice';
import { CodeGenerator } from '../services/codeGenerator';
import { PDFService } from '../services/pdfService';
import { EmailService } from '../services/emailService';

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
        status,
        payment_type,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (customer_id) where.customer_id = customer_id;
      if (rental_id) where.rental_id = rental_id;
      if (status) where.status = status;
      if (payment_type) where.payment_type = payment_type;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: payments } = await Payment.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer' },
          { model: Rental, as: 'rental' }
        ]
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
      console.error('[PAYMENT] Error obteniendo pagos:', error);
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
      console.error('[PAYMENT] Error obteniendo pago:', error);
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
  static async createPayment(req: Request, res: Response) {
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

      // Crear el pago
      const payment = await Payment.create({
        payment_code: paymentCode,
        rental_id,
        invoice_id,
        customer_id,
        amount,
        payment_method,
        payment_type: payment_type as PaymentType,
        status: PaymentStatus.COMPLETED,
        reference_number,
        transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
        notes,
        processed_by: (req as any).user?.id
      }, { transaction });

      // Si hay factura asociada, actualizar balance
      if (invoice_id) {
        const invoice = await Invoice.findByPk(invoice_id, { transaction });
        if (invoice) {
          // Proteger contra pagos que excedan el total
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

      // Commit de la transacción
      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Pago registrado exitosamente',
        data: payment
      });

    } catch (error) {
      await transaction.rollback();
      console.error('[PAYMENT] Error registrando pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar pago',
      });
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
        status,
        page = 1,
        limit = 20
      } = req.query;

      const where: any = {};

      if (customer_id) where.customer_id = customer_id;
      if (rental_id) where.rental_id = rental_id;
      if (status) where.status = status;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: invoices } = await Invoice.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer' },
          { model: Rental, as: 'rental' }
        ]
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
      console.error('[PAYMENT] Error obteniendo facturas:', error);
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
          { model: Payment, as: 'payments' }
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
      console.error('[PAYMENT] Error obteniendo factura:', error);
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
  static async createInvoice(req: Request, res: Response) {
    try {
      const {
        rental_id,
        customer_id,
        due_days = 7,
        notes
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
        created_by: (req as any).user?.id
      });

      // Generar PDF de factura
      const pdfUrl = await PDFService.generateInvoice(invoice);
      await invoice.update({ pdf_url: pdfUrl });

      // Enviar factura por email
      await EmailService.sendInvoice(customer, invoice, pdfUrl);

      res.status(201).json({
        success: true,
        message: 'Factura creada y enviada exitosamente',
        data: invoice
      });

    } catch (error) {
      console.error('[PAYMENT] Error creando factura:', error);
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
      console.error('[PAYMENT] Error reenviando factura:', error);
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
      console.error('[PAYMENT] Error obteniendo facturas vencidas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener facturas vencidas',
      });
    }
  }
}
