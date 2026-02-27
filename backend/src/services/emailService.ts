import nodemailer from 'nodemailer';
import { env } from '../config/env';
import Customer from '../models/Customer';
import Rental from '../models/Rental';
import Invoice from '../models/Invoice';
import Quote from '../models/Quote';
import logger from '../config/logger';

/**
 * Servicio de Emails con Nodemailer
 * Envía notificaciones automáticas a clientes
 */
export class EmailService {
  private static transporter: nodemailer.Transporter;

  /**
   * Inicializa el transportador de email
   * Usa variables de entorno validadas desde env.ts
   */
  static initialize() {
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST || 'smtp.gmail.com',
      port: env.EMAIL_PORT || 587,
      secure: env.EMAIL_SECURE || false,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Envía email de confirmación de renta
   */
  static async sendRentalConfirmation(
    customer: Customer,
    rental: Rental,
    contractPdfPath?: string
  ): Promise<void> {
    if (!this.transporter) {
      this.initialize();
    }

    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@movicar.com',
      to: customer.email,
      subject: `Confirmación de Renta - ${rental.rental_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">¡Renta Confirmada!</h2>

          <p>Estimado/a ${customer.name},</p>

          <p>Su renta ha sido confirmada exitosamente. A continuación los detalles:</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Renta</h3>
            <p><strong>Código de renta:</strong> ${rental.rental_code}</p>
            <p><strong>Fecha de inicio:</strong> ${new Date(rental.start_date).toLocaleDateString()}</p>
            <p><strong>Fecha de fin:</strong> ${new Date(rental.end_date).toLocaleDateString()}</p>
            <p><strong>Días:</strong> ${rental.days}</p>
            <p><strong>Total:</strong> $${rental.total_amount}</p>
          </div>

          <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <p style="margin: 0;"><strong>Recordatorio:</strong> Por favor llegue a tiempo el día de recogida con su licencia de conducir vigente.</p>
          </div>

          <p>El contrato de renta se encuentra adjunto a este correo.</p>

          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>

          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo MOVICAR</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
            Este es un correo automático, por favor no responda a este mensaje.
          </p>
        </div>
      `,
      attachments: contractPdfPath ? [{
        filename: `contrato-${rental.rental_code}.pdf`,
        path: contractPdfPath
      }] : []
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Confirmacion de renta enviada a ${customer.email}`);
    } catch (error) {
      logger.error('[EMAIL] Error enviando email de confirmacion', { error });
      throw error;
    }
  }

  /**
   * Envía email de confirmación de devolución
   */
  static async sendReturnConfirmation(
    customer: Customer,
    rental: Rental
  ): Promise<void> {
    if (!this.transporter) {
      this.initialize();
    }

    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@movicar.com',
      to: customer.email,
      subject: `Devolución Completada - ${rental.rental_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">¡Devolución Exitosa!</h2>

          <p>Estimado/a ${customer.name},</p>

          <p>La devolución de su vehículo ha sido procesada exitosamente.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Resumen de la Renta</h3>
            <p><strong>Código:</strong> ${rental.rental_code}</p>
            <p><strong>Fecha de devolución:</strong> ${rental.actual_return_date ? new Date(rental.actual_return_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Total pagado:</strong> $${rental.total_amount}</p>
          </div>

          <p>Gracias por su preferencia. Esperamos verle pronto nuevamente.</p>

          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo MOVICAR</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
            Este es un correo automático, por favor no responda a este mensaje.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Confirmacion de devolucion enviada a ${customer.email}`);
    } catch (error) {
      logger.error('[EMAIL] Error enviando email de devolucion', { error });
      throw error;
    }
  }

  /**
   * Envía email con factura
   */
  static async sendInvoice(
    customer: Customer,
    invoice: Invoice,
    invoicePdfPath?: string
  ): Promise<void> {
    if (!this.transporter) {
      this.initialize();
    }

    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@movicar.com',
      to: customer.email,
      subject: `Factura ${invoice.invoice_code} - MOVICAR`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Nueva Factura</h2>

          <p>Estimado/a ${customer.name},</p>

          <p>Adjuntamos su factura correspondiente a la renta realizada.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Factura</h3>
            <p><strong>Número de factura:</strong> ${invoice.invoice_code}</p>
            <p><strong>Fecha de emisión:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p><strong>Fecha de vencimiento:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            <p><strong>Total:</strong> $${invoice.total_amount}</p>
            <p><strong>Saldo pendiente:</strong> <span style="color: ${invoice.balance > 0 ? '#e74c3c' : '#27ae60'};">$${invoice.balance}</span></p>
          </div>

          ${invoice.balance > 0 ? `
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0;"><strong>Atención:</strong> Tiene un saldo pendiente de $${invoice.balance}. Por favor realice el pago antes de la fecha de vencimiento.</p>
          </div>
          ` : ''}

          <p>La factura se encuentra adjunta en formato PDF.</p>

          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo MOVICAR</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
            Este es un correo automático, por favor no responda a este mensaje.
          </p>
        </div>
      `,
      attachments: invoicePdfPath ? [{
        filename: `factura-${invoice.invoice_code}.pdf`,
        path: invoicePdfPath
      }] : []
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Factura enviada a ${customer.email}`);
    } catch (error) {
      logger.error('[EMAIL] Error enviando factura', { error });
      throw error;
    }
  }

  /**
   * Envía recordatorio de pago
   */
  static async sendPaymentReminder(
    customer: Customer,
    invoice: Invoice
  ): Promise<void> {
    if (!this.transporter) {
      this.initialize();
    }

    const daysUntilDue = Math.ceil(
      (new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@movicar.com',
      to: customer.email,
      subject: `Recordatorio de Pago - Factura ${invoice.invoice_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e67e22;">Recordatorio de Pago</h2>

          <p>Estimado/a ${customer.name},</p>

          <p>Le recordamos que tiene un saldo pendiente por pagar.</p>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Información del Pago</h3>
            <p><strong>Factura:</strong> ${invoice.invoice_code}</p>
            <p><strong>Monto pendiente:</strong> <span style="font-size: 24px; color: #e74c3c;">$${invoice.balance}</span></p>
            <p><strong>Vence en:</strong> ${daysUntilDue} día(s) - ${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>

          <p>Por favor realice el pago a la brevedad para evitar cargos adicionales.</p>

          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo MOVICAR</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
            Este es un correo automático, por favor no responda a este mensaje.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Recordatorio de pago enviado a ${customer.email}`);
    } catch (error) {
      logger.error('[EMAIL] Error enviando recordatorio de pago', { error });
      throw error;
    }
  }

  /**
   * Envía email con cotización al cliente
   */
  static async sendQuote(
    customer: Customer,
    quote: Quote,
    quotePdfPath?: string
  ): Promise<void> {
    if (!this.transporter) {
      this.initialize();
    }

    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@movicar.com',
      to: customer.email,
      subject: `Cotización ${quote.quote_code} - MOVICAR`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Cotización de Renta</h2>

          <p>Estimado/a ${customer.name},</p>

          <p>Adjuntamos la cotización solicitada para su revisión.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Cotización</h3>
            <p><strong>Código:</strong> ${quote.quote_code}</p>
            ${quote.start_date ? `<p><strong>Fecha de inicio:</strong> ${new Date(quote.start_date).toLocaleDateString()}</p>` : ''}
            ${quote.end_date ? `<p><strong>Fecha de fin:</strong> ${new Date(quote.end_date).toLocaleDateString()}</p>` : ''}
            ${quote.days ? `<p><strong>Días:</strong> ${quote.days}</p>` : ''}
            <p><strong>Total:</strong> $${quote.total_amount}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0;"><strong>Vigencia:</strong> Esta cotización es válida hasta el ${new Date(quote.valid_until).toLocaleDateString()}.</p>
          </div>

          <p>La cotización completa se encuentra adjunta en formato PDF.</p>

          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>

          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo MOVICAR</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
            Este es un correo automático, por favor no responda a este mensaje.
          </p>
        </div>
      `,
      attachments: quotePdfPath ? [{
        filename: `cotizacion-${quote.quote_code}.pdf`,
        path: quotePdfPath
      }] : []
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Cotizacion enviada a ${customer.email}`);
    } catch (error) {
      logger.error('[EMAIL] Error enviando cotizacion', { error });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    if (!this.transporter) {
      this.initialize();
    }

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@movicar.com',
      to: email,
      subject: 'Recuperación de Contraseña - MOVICAR',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">MOVICAR</h1>
          </div>

          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 22px; margin-top: 0;">Recuperación de Contraseña</h2>
            <p style="color: #4b5563; font-size: 16px; margin: 16px 0;">Hola <strong>${userName}</strong>,</p>
            <p style="color: #4b5563; font-size: 16px; margin: 16px 0;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en MOVICAR.</p>
            <p style="color: #4b5563; font-size: 16px; margin: 16px 0;">Para continuar con el proceso de recuperación, haz clic en el siguiente botón:</p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">Restablecer Contraseña</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="font-size: 14px; margin: 16px 0;">
              <a href="${resetUrl}" style="color: #8b5cf6; text-decoration: none; word-break: break-all;">${resetUrl}</a>
            </p>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Este enlace expirará en 24 horas.</strong></p>
              <p style="color: #92400e; margin: 8px 0 0 0; font-size: 14px;">Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
            </div>
          </div>

          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0;"><strong>MOVICAR</strong></p>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">Sistema de Gestión de Renta de Vehículos</p>
            <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      `,
      text: `
MOVICAR - Recuperación de Contraseña

Hola ${userName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en MOVICAR.

Para continuar con el proceso de recuperación, visita el siguiente enlace:
${resetUrl}

Este enlace expirará en 24 horas.

Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.

--
MOVICAR
Sistema de Gestión de Renta de Vehículos
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('[EMAIL] Error sending password reset email', { error });
      return false;
    }
  }

  /**
   * Send password changed confirmation email
   */
  static async sendPasswordChangedEmail(email: string, userName: string): Promise<boolean> {
    if (!this.transporter) {
      this.initialize();
    }

    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@movicar.com',
      to: email,
      subject: 'Contraseña Actualizada - MOVICAR',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">MOVICAR</h1>
          </div>

          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 22px; margin-top: 0;">Contraseña Actualizada</h2>
            <p style="color: #4b5563; font-size: 16px; margin: 16px 0;">Hola <strong>${userName}</strong>,</p>
            <p style="color: #4b5563; font-size: 16px; margin: 16px 0;">Tu contraseña ha sido actualizada correctamente.</p>

            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;"><strong>Cambio realizado exitosamente</strong></p>
              <p style="color: #065f46; margin: 8px 0 0 0; font-size: 14px;">Tu contraseña fue modificada el ${new Date().toLocaleString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}.</p>
            </div>

            <p style="color: #4b5563; font-size: 16px; margin: 16px 0;">Si no realizaste este cambio, por favor contacta inmediatamente con el administrador del sistema.</p>
          </div>

          <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0;"><strong>MOVICAR</strong></p>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">Sistema de Gestión de Renta de Vehículos</p>
            <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      `,
      text: `
MOVICAR - Contraseña Actualizada

Hola ${userName},

Tu contraseña ha sido actualizada correctamente.

Si no realizaste este cambio, por favor contacta inmediatamente con el administrador del sistema.

--
MOVICAR
Sistema de Gestión de Renta de Vehículos
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Password changed confirmation sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('[EMAIL] Error sending password changed email', { error });
      return false;
    }
  }
}
