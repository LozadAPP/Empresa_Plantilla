import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import Rental from '../models/Rental';
import Customer from '../models/Customer';
import Vehicle from '../models/Vehicle';
import Location from '../models/Location';
import Invoice from '../models/Invoice';
import InvoiceLineItem from '../models/InvoiceLineItem';
import Quote from '../models/Quote';
import VehicleType from '../models/VehicleType';
import SystemConfig from '../models/SystemConfig';
import { SAT_FORMA_PAGO, SAT_METODO_PAGO, SAT_USO_CFDI, SAT_REGIMEN_FISCAL } from '../constants/satCatalogs';

/**
 * Servicio para generar PDFs (Contratos, Facturas y Cotizaciones)
 * Usa PDFKit para crear documentos profesionales
 */
export class PDFService {

  private static STORAGE_PATH = path.join(__dirname, '../../storage/pdfs');

  /**
   * Inicializa el directorio de almacenamiento
   */
  static initialize() {
    if (!fs.existsSync(this.STORAGE_PATH)) {
      fs.mkdirSync(this.STORAGE_PATH, { recursive: true });
    }
  }

  /**
   * Genera un contrato de renta en PDF
   */
  static async generateContract(rental: Rental): Promise<string> {
    this.initialize();

    // Obtener datos relacionados
    const customer = await Customer.findByPk(rental.customer_id);
    const vehicle = await Vehicle.findByPk(rental.vehicle_id);
    const location = await Location.findByPk(rental.location_id);

    if (!customer || !vehicle || !location) {
      throw new Error('Datos incompletos para generar contrato');
    }

    const fileName = `contract-${rental.rental_code}.pdf`;
    const filePath = path.join(this.STORAGE_PATH, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Encabezado
        doc.fontSize(20).text('CONTRATO DE RENTA DE VEHÍCULO', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Contrato No: ${rental.rental_code}`, { align: 'center' });
        doc.moveDown(2);

        // Información del cliente
        doc.fontSize(14).text('DATOS DEL CLIENTE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Nombre: ${customer.name}`);
        doc.text(`Email: ${customer.email || 'N/A'}`);
        doc.text(`Teléfono: ${customer.phone || 'N/A'}`);
        doc.text(`RFC/ID: ${customer.tax_id || 'N/A'}`);
        doc.text(`Contacto: ${customer.contact_person || 'N/A'}`);
        doc.moveDown(1.5);

        // Información del vehículo
        doc.fontSize(14).text('DATOS DEL VEHÍCULO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Vehículo: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);
        doc.text(`Placa: ${vehicle.license_plate}`);
        doc.text(`Color: ${vehicle.color || 'N/A'}`);
        doc.text(`Tipo: ${vehicle.vehicle_type_id}`);
        if (vehicle.vin) doc.text(`VIN: ${vehicle.vin}`);
        doc.moveDown(1.5);

        // Detalles de la renta
        doc.fontSize(14).text('DETALLES DE LA RENTA', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Fecha de inicio: ${new Date(rental.start_date).toLocaleDateString()}`);
        doc.text(`Fecha de fin: ${new Date(rental.end_date).toLocaleDateString()}`);
        doc.text(`Días: ${rental.days}`);
        doc.text(`Tarifa diaria: $${rental.daily_rate}`);
        doc.text(`Ubicación de recogida: ${location.name}, ${location.city}`);
        doc.moveDown(1.5);

        // Montos
        doc.fontSize(14).text('MONTOS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Subtotal: $${rental.subtotal}`);
        if (rental.discount_amount && rental.discount_amount > 0) {
          doc.text(`Descuento (${rental.discount_percentage}%): -$${rental.discount_amount}`);
        }
        if (rental.insurance_amount && rental.insurance_amount > 0) {
          doc.text(`Seguro: $${rental.insurance_amount}`);
        }
        if (rental.extras_amount && rental.extras_amount > 0) {
          doc.text(`Extras: $${rental.extras_amount}`);
        }
        doc.text(`IVA (${rental.tax_percentage}%): $${rental.tax_amount}`);
        doc.moveDown(0.5);
        doc.fontSize(12).text(`TOTAL: $${rental.total_amount}`, { underline: true });
        doc.moveDown(2);

        // Términos y condiciones
        doc.fontSize(12).text('TÉRMINOS Y CONDICIONES', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);
        doc.text('1. El cliente se compromete a devolver el vehículo en las mismas condiciones en que lo recibió.');
        doc.text('2. El cliente es responsable de cualquier daño al vehículo durante el período de renta.');
        doc.text('3. La devolución tardía generará cargos adicionales de 1.5x la tarifa diaria por día de retraso.');
        doc.text('4. El vehículo debe ser devuelto con el mismo nivel de combustible.');
        doc.text('5. El cliente debe contar con licencia de conducir válida durante todo el período de renta.');
        doc.moveDown(2);

        // Firmas
        doc.fontSize(10);
        doc.text('_________________________', 100, doc.y + 50);
        doc.text('Firma del Cliente', 120, doc.y + 5);

        doc.text('_________________________', 350, doc.y - 20);
        doc.text('Firma Autorizada', 370, doc.y + 5);

        doc.moveDown(2);
        doc.fontSize(8).text(
          `Documento generado el ${new Date().toLocaleString()}`,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera una factura en PDF con soporte CFDI 4.0
   * Incluye: datos fiscales emisor/receptor, tabla de líneas, QR, UUID
   */
  static async generateInvoice(invoice: Invoice): Promise<string> {
    this.initialize();

    // Obtener datos relacionados
    const rental = await Rental.findByPk(invoice.rental_id);
    const customer = await Customer.findByPk(invoice.customer_id);

    if (!rental || !customer) {
      throw new Error('Datos incompletos para generar factura');
    }

    // Cargar líneas de detalle
    const lineItems = await InvoiceLineItem.findAll({
      where: { invoiceId: invoice.id },
      order: [['sort_order', 'ASC']],
    });

    const fileName = `invoice-${invoice.invoice_code}.pdf`;
    const filePath = path.join(this.STORAGE_PATH, fileName);

    // Leer datos de empresa desde system_configs
    const companyConfigs = await SystemConfig.findAll({
      where: { category: 'fiscal' }
    });
    const configMap = Object.fromEntries(companyConfigs.map(c => [c.configKey, c.configValue]));

    // Also load company_name from general config
    const nameConfig = await SystemConfig.findOne({ where: { configKey: 'company_name' } });
    const companyName = configMap.company_razon_social || nameConfig?.configValue || 'MOVICAR';

    // Generate QR code buffer if qr_data exists
    let qrBuffer: Buffer | null = null;
    if (invoice.qr_data) {
      try {
        qrBuffer = await QRCode.toBuffer(invoice.qr_data, { width: 120, margin: 1 });
      } catch {
        // QR generation failed, continue without it
      }
    }

    const hasCfdi = !!invoice.uuid;
    const fmt = (n: any) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const pageWidth = doc.page.width - 80; // 40 margin each side

        // ═══ HEADER ═══
        // Left: Company info
        doc.fontSize(16).text(companyName, 40, 40, { width: 300 });
        doc.fontSize(8);
        if (configMap.company_rfc) doc.text(`RFC: ${configMap.company_rfc}`, 40, doc.y);
        if (configMap.company_regimen_fiscal) doc.text(`Régimen: ${SAT_REGIMEN_FISCAL[configMap.company_regimen_fiscal] || configMap.company_regimen_fiscal}`, 40, doc.y);
        if (configMap.company_zip_code) doc.text(`C.P.: ${configMap.company_zip_code}`, 40, doc.y);
        if (configMap.company_address) doc.text(configMap.company_address, 40, doc.y);

        // Right: Invoice info
        const rightX = 380;
        doc.fontSize(18).text('FACTURA', rightX, 40, { width: 190, align: 'right' });
        doc.fontSize(9);
        doc.text(`No: ${invoice.invoice_code}`, rightX, doc.y, { width: 190, align: 'right' });
        if (hasCfdi && invoice.serie && invoice.folio) {
          doc.text(`Serie: ${invoice.serie} Folio: ${invoice.folio}`, rightX, doc.y, { width: 190, align: 'right' });
        }
        if (hasCfdi && invoice.uuid) {
          doc.fontSize(7).text(`UUID: ${invoice.uuid}`, rightX, doc.y, { width: 190, align: 'right' });
          doc.fontSize(9);
        }
        doc.text(`Fecha emisión: ${new Date(invoice.issue_date).toLocaleDateString('es-MX')}`, rightX, doc.y, { width: 190, align: 'right' });
        doc.text(`Vencimiento: ${new Date(invoice.due_date).toLocaleDateString('es-MX')}`, rightX, doc.y, { width: 190, align: 'right' });
        if (hasCfdi && invoice.stamp_date) {
          doc.text(`Timbrado: ${new Date(invoice.stamp_date).toLocaleDateString('es-MX')}`, rightX, doc.y, { width: 190, align: 'right' });
        }

        // Status badge
        const statusColors: Record<string, string> = { stamped: '#22c55e', cancelled: '#ef4444', pending_stamp: '#f59e0b' };
        const statusLabels: Record<string, string> = { stamped: 'TIMBRADA', cancelled: 'CANCELADA', pending_stamp: 'PENDIENTE' };
        if (invoice.cfdi_status && statusColors[invoice.cfdi_status]) {
          doc.rect(rightX + 100, doc.y + 2, 90, 14).fill(statusColors[invoice.cfdi_status]);
          doc.fillColor('#ffffff').fontSize(8).text(statusLabels[invoice.cfdi_status] || '', rightX + 100, doc.y + 5, { width: 90, align: 'center' });
          doc.fillColor('#000000');
        }

        doc.moveDown(1);
        const separatorY = Math.max(doc.y, 140);

        // Separator line
        doc.moveTo(40, separatorY).lineTo(572, separatorY).lineWidth(0.5).stroke('#cccccc');

        // ═══ RECEPTOR (Client Info) ═══
        let clientY = separatorY + 8;
        doc.fontSize(10).fillColor('#6b21a8').text('RECEPTOR', 40, clientY);
        doc.fillColor('#000000').fontSize(9);
        clientY = doc.y + 2;
        doc.text(customer.name, 40, clientY);
        if (customer.rfc) doc.text(`RFC: ${customer.rfc}`, 40, doc.y);
        if (customer.regimen_fiscal) doc.text(`Régimen: ${SAT_REGIMEN_FISCAL[customer.regimen_fiscal] || customer.regimen_fiscal}`, 40, doc.y);
        if (customer.zip_code) doc.text(`C.P.: ${customer.zip_code}`, 40, doc.y);
        if (customer.email) doc.text(`Email: ${customer.email}`, 40, doc.y);
        if (customer.address) doc.text(customer.address, 40, doc.y);

        // Right: CFDI fiscal fields
        if (hasCfdi) {
          doc.fontSize(10).fillColor('#6b21a8').text('DATOS CFDI', rightX, separatorY + 8);
          doc.fillColor('#000000').fontSize(9);
          if (invoice.uso_cfdi) doc.text(`Uso CFDI: ${invoice.uso_cfdi} - ${SAT_USO_CFDI[invoice.uso_cfdi] || ''}`, rightX, doc.y + 2);
          if (invoice.payment_form_code) doc.text(`Forma Pago: ${invoice.payment_form_code} - ${SAT_FORMA_PAGO[invoice.payment_form_code] || ''}`, rightX, doc.y);
          if (invoice.payment_method_code) doc.text(`Método Pago: ${invoice.payment_method_code} - ${SAT_METODO_PAGO[invoice.payment_method_code] || ''}`, rightX, doc.y);
          if (invoice.currency_code) doc.text(`Moneda: ${invoice.currency_code}`, rightX, doc.y);
        }

        doc.moveDown(1);
        doc.text(`Renta asociada: ${rental.rental_code}`, 40, doc.y);
        doc.moveDown(1);

        // ═══ TABLE: Line Items or Simple ═══
        if (lineItems.length > 0) {
          // Full line items table
          const colX = { clave: 40, desc: 105, cant: 300, unit: 345, precio: 385, desc2: 440, importe: 490 };
          const tableHeaderY = doc.y;

          // Table header background
          doc.rect(40, tableHeaderY - 2, pageWidth, 14).fill('#f3f4f6');
          doc.fillColor('#000000').fontSize(7);
          doc.text('Clave', colX.clave, tableHeaderY, { width: 60 });
          doc.text('Descripción', colX.desc, tableHeaderY, { width: 190 });
          doc.text('Cant.', colX.cant, tableHeaderY, { width: 40, align: 'right' });
          doc.text('Unidad', colX.unit, tableHeaderY, { width: 35 });
          doc.text('P. Unit.', colX.precio, tableHeaderY, { width: 50, align: 'right' });
          doc.text('Desc.', colX.desc2, tableHeaderY, { width: 45, align: 'right' });
          doc.text('Importe', colX.importe, tableHeaderY, { width: 72, align: 'right' });

          let rowY = tableHeaderY + 16;

          for (const item of lineItems) {
            if (rowY > 680) {
              doc.addPage();
              rowY = 40;
            }

            // Alternate row background
            const rowIdx = lineItems.indexOf(item);
            if (rowIdx % 2 === 1) {
              doc.rect(40, rowY - 2, pageWidth, 13).fill('#fafafa');
              doc.fillColor('#000000');
            }

            doc.fontSize(7);
            doc.text(item.satProductCode, colX.clave, rowY, { width: 60 });
            doc.text(item.description, colX.desc, rowY, { width: 190 });
            doc.text(Number(item.quantity).toFixed(2), colX.cant, rowY, { width: 40, align: 'right' });
            doc.text(item.unitCode, colX.unit, rowY, { width: 35 });
            doc.text(fmt(item.unitPrice), colX.precio, rowY, { width: 50, align: 'right' });
            doc.text(fmt(item.discount), colX.desc2, rowY, { width: 45, align: 'right' });
            doc.text(fmt(item.subtotal), colX.importe, rowY, { width: 72, align: 'right' });
            rowY += 14;
          }

          // Separator
          doc.moveTo(40, rowY).lineTo(572, rowY).lineWidth(0.5).stroke('#cccccc');
          rowY += 8;

          // Totals
          const totalsX = 420;
          doc.fontSize(9);
          doc.text('Subtotal:', totalsX, rowY, { width: 70, align: 'right' });
          doc.text(fmt(invoice.subtotal), 495, rowY, { width: 67, align: 'right' });
          rowY += 14;

          if (invoice.discount_amount && Number(invoice.discount_amount) > 0) {
            doc.text('Descuento:', totalsX, rowY, { width: 70, align: 'right' });
            doc.text(`-${fmt(invoice.discount_amount)}`, 495, rowY, { width: 67, align: 'right' });
            rowY += 14;
          }

          doc.text('IVA (16%):', totalsX, rowY, { width: 70, align: 'right' });
          doc.text(fmt(invoice.tax_amount), 495, rowY, { width: 67, align: 'right' });
          rowY += 16;

          doc.fontSize(12);
          doc.text('TOTAL:', totalsX, rowY, { width: 70, align: 'right' });
          doc.text(fmt(invoice.total_amount), 495, rowY, { width: 67, align: 'right' });
          rowY += 18;

          // Paid / Balance
          doc.fontSize(9);
          doc.text('Pagado:', totalsX, rowY, { width: 70, align: 'right' });
          doc.text(fmt(invoice.paid_amount || 0), 495, rowY, { width: 67, align: 'right' });
          rowY += 14;
          doc.fontSize(10);
          doc.text('SALDO:', totalsX, rowY, { width: 70, align: 'right' });
          doc.text(fmt(invoice.balance), 495, rowY, { width: 67, align: 'right' });

          doc.y = rowY + 20;
        } else {
          // Legacy: no line items — simple table
          const tableTop = doc.y;
          doc.fontSize(10);
          doc.text('Concepto', 50, tableTop);
          doc.text('Monto', 400, tableTop, { width: 90, align: 'right' });
          doc.moveDown(0.3);
          doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
          doc.moveDown(0.3);

          doc.text(`Renta de vehículo (${rental.days} días)`, 50, doc.y);
          doc.text(fmt(invoice.subtotal), 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.8);

          if (invoice.discount_amount && Number(invoice.discount_amount) > 0) {
            doc.text('Descuento', 50, doc.y);
            doc.text(`-${fmt(invoice.discount_amount)}`, 400, doc.y, { width: 90, align: 'right' });
            doc.moveDown(0.8);
          }

          doc.text('IVA', 50, doc.y);
          doc.text(fmt(invoice.tax_amount), 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.8);
          doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
          doc.moveDown(0.5);

          doc.fontSize(12).text('TOTAL', 50, doc.y);
          doc.text(fmt(invoice.total_amount), 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(1);

          doc.fontSize(10).text('Pagado', 50, doc.y);
          doc.text(fmt(invoice.paid_amount || 0), 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.5);

          doc.fontSize(12).text('SALDO', 50, doc.y, { underline: true });
          doc.text(fmt(invoice.balance), 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(2);
        }

        // ═══ QR CODE + CADENA ORIGINAL (if CFDI stamped) ═══
        if (qrBuffer && hasCfdi) {
          const qrY = Math.min(doc.y + 10, 640);
          doc.image(qrBuffer, 40, qrY, { width: 100 });

          doc.fontSize(7).fillColor('#666666');
          doc.text('Cadena original del complemento de certificación digital del SAT:', 150, qrY, { width: 400 });
          doc.text('||1.1|' + (invoice.uuid || '') + '|SIMULADO||', 150, doc.y, { width: 400 });
          doc.moveDown(0.5);
          doc.text('Este documento es una representación impresa de un CFDI 4.0', 150, doc.y, { width: 400 });
          if (invoice.cfdi_status !== 'stamped') {
            doc.fillColor('#ef4444').text('MODO SIMULADO — Sin timbrado real ante el SAT', 150, doc.y, { width: 400 });
          }
          doc.fillColor('#000000');
        }

        // ═══ NOTES ═══
        if (invoice.notes) {
          doc.moveDown(1);
          doc.fontSize(9).text('Notas:', 40, doc.y, { underline: true });
          doc.fontSize(8).text(invoice.notes, 40, doc.y);
        }

        // ═══ FOOTER ═══
        doc.fontSize(7).fillColor('#999999').text(
          `Documento generado el ${new Date().toLocaleString('es-MX')} | MOVICAR`,
          40, 740, { align: 'center', width: pageWidth }
        );

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera una cotización en PDF
   */
  static async generateQuote(quote: Quote): Promise<string> {
    this.initialize();

    // Obtener datos relacionados
    const customer = await Customer.findByPk(quote.customer_id);
    if (!customer) {
      throw new Error('Datos incompletos para generar cotización: cliente no encontrado');
    }

    const vehicle = quote.vehicle_id ? await Vehicle.findByPk(quote.vehicle_id) : null;
    const location = quote.location_id ? await Location.findByPk(quote.location_id) : null;

    // Leer datos de empresa desde system_configs
    const companyConfigs = await SystemConfig.findAll({
      where: { configKey: ['company_name', 'company_rfc', 'company_address', 'company_phone'] }
    });
    const configMap = Object.fromEntries(companyConfigs.map(c => [c.configKey, c.configValue]));

    const fileName = `quote-${quote.quote_code}.pdf`;
    const filePath = path.join(this.STORAGE_PATH, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Encabezado
        doc.fontSize(24).text('COTIZACIÓN', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Cotización No: ${quote.quote_code}`, { align: 'center' });
        doc.moveDown(2);

        // Información de la empresa
        doc.fontSize(14).text(configMap.company_name || 'MOVICAR', { underline: true });
        doc.fontSize(10);
        doc.text(`RFC: ${configMap.company_rfc || ''}`);
        doc.text(`Dirección: ${configMap.company_address || ''}`);
        if (configMap.company_phone) doc.text(`Teléfono: ${configMap.company_phone}`);
        doc.moveDown(1);

        // Información del cliente
        doc.fontSize(14).text('DATOS DEL CLIENTE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Nombre: ${customer.name}`);
        doc.text(`Email: ${customer.email || 'N/A'}`);
        doc.text(`Teléfono: ${customer.phone || 'N/A'}`);
        doc.text(`RFC/ID: ${customer.tax_id || 'N/A'}`);
        doc.moveDown(1.5);

        // Información del vehículo (si existe)
        if (vehicle) {
          doc.fontSize(14).text('DATOS DEL VEHÍCULO', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);
          doc.text(`Vehículo: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);
          doc.text(`Placa: ${vehicle.license_plate}`);
          doc.text(`Color: ${vehicle.color || 'N/A'}`);
          if (vehicle.vin) doc.text(`VIN: ${vehicle.vin}`);
          doc.moveDown(1.5);
        }

        // Detalles del período
        if (quote.start_date && quote.end_date) {
          doc.fontSize(14).text('PERÍODO DE RENTA', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);
          doc.text(`Fecha de inicio: ${new Date(quote.start_date).toLocaleDateString()}`);
          doc.text(`Fecha de fin: ${new Date(quote.end_date).toLocaleDateString()}`);
          doc.text(`Días: ${quote.days || 'N/A'}`);
          if (quote.daily_rate) doc.text(`Tarifa diaria: $${quote.daily_rate}`);
          if (location) doc.text(`Ubicación de recogida: ${location.name}, ${location.city}`);
          doc.moveDown(1.5);
        }

        // Desglose financiero (tabla)
        doc.fontSize(14).text('DESGLOSE FINANCIERO', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.fontSize(10);

        // Headers
        doc.text('Concepto', 50, tableTop);
        doc.text('Monto', 400, tableTop, { width: 90, align: 'right' });
        doc.moveDown(0.3);

        // Line
        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(0.3);

        // Items
        if (quote.days && quote.daily_rate) {
          doc.text(`Renta de vehículo (${quote.days} días × $${quote.daily_rate})`, 50, doc.y);
        } else {
          doc.text('Subtotal', 50, doc.y);
        }
        doc.text(`$${quote.subtotal}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(0.8);

        if (quote.discount_amount && Number(quote.discount_amount) > 0) {
          doc.text(`Descuento (${quote.discount_percentage}%)`, 50, doc.y);
          doc.text(`-$${quote.discount_amount}`, 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.8);
        }

        if (quote.insurance_amount && Number(quote.insurance_amount) > 0) {
          doc.text('Seguro', 50, doc.y);
          doc.text(`$${quote.insurance_amount}`, 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.8);
        }

        if (quote.extras_amount && Number(quote.extras_amount) > 0) {
          doc.text('Extras', 50, doc.y);
          doc.text(`$${quote.extras_amount}`, 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.8);
        }

        if (quote.shipping_cost && Number(quote.shipping_cost) > 0) {
          doc.text('Envío', 50, doc.y);
          doc.text(`$${quote.shipping_cost}`, 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.8);
        }

        doc.text(`IVA (${quote.tax_percentage}%)`, 50, doc.y);
        doc.text(`$${quote.tax_amount}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(0.8);

        // Line
        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(0.5);

        // Total
        doc.fontSize(12).text('TOTAL', 50, doc.y);
        doc.text(`$${quote.total_amount}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(1);

        if (quote.deposit_amount && Number(quote.deposit_amount) > 0) {
          doc.fontSize(10).text('Depósito requerido', 50, doc.y);
          doc.text(`$${quote.deposit_amount}`, 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(1);
        }

        // Vigencia
        doc.moveDown(0.5);
        doc.fontSize(12).text('VIGENCIA', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(
          `Esta cotización es válida hasta el ${new Date(quote.valid_until).toLocaleDateString()}.`
        );
        doc.moveDown(1.5);

        // Notas
        if (quote.notes) {
          doc.fontSize(10).text('Notas:', { underline: true });
          doc.fontSize(9).text(quote.notes);
          doc.moveDown(1);
        }

        // Términos y condiciones
        doc.fontSize(12).text('TÉRMINOS Y CONDICIONES', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);
        doc.text('1. Los precios incluyen IVA y están sujetos a disponibilidad del vehículo.');
        doc.text('2. El cliente debe presentar licencia de conducir vigente al momento de la renta.');
        doc.text('3. Se requiere depósito de garantía (reembolsable al devolver el vehículo en buenas condiciones).');
        doc.text('4. Esta cotización no constituye una reservación. Para confirmar, contacte a su asesor.');
        doc.moveDown(2);

        // Firmas
        doc.fontSize(10);
        doc.text('_________________________', 100, doc.y + 50);
        doc.text('Firma del Cliente', 120, doc.y + 5);

        doc.text('_________________________', 350, doc.y - 20);
        doc.text('Firma Autorizada', 370, doc.y + 5);

        doc.moveDown(2);
        doc.fontSize(8).text(
          `Documento generado el ${new Date().toLocaleString()}`,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera una ficha técnica de vehículo en PDF
   */
  static async generateFicha(vehicle: Vehicle): Promise<string> {
    this.initialize();

    // Load related data if not already included
    const vehicleType = vehicle.vehicle_type_id
      ? await VehicleType.findByPk(vehicle.vehicle_type_id)
      : null;
    const location = vehicle.location_id
      ? await Location.findByPk(vehicle.location_id)
      : null;

    // Company info
    const companyConfigs = await SystemConfig.findAll({
      where: { configKey: ['company_name', 'company_rfc', 'company_address', 'company_phone'] }
    });
    const configMap = Object.fromEntries(companyConfigs.map(c => [c.configKey, c.configValue]));

    const fileName = `ficha-${vehicle.license_plate || vehicle.id}.pdf`;
    const filePath = path.join(this.STORAGE_PATH, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // ── Header ──────────────────────────────
        doc.fontSize(24).text('FICHA TÉCNICA', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(configMap.company_name || 'MOVICAR', { align: 'center' });
        if (configMap.company_phone) {
          doc.fontSize(9).text(`Tel: ${configMap.company_phone}`, { align: 'center' });
        }
        doc.moveDown(1.5);

        // ── Vehicle identity ────────────────────
        doc.fontSize(18).text(`${vehicle.make} ${vehicle.model}`, { align: 'center' });
        doc.fontSize(14).text(`${vehicle.year}`, { align: 'center' });
        if (vehicle.color) {
          doc.fontSize(11).text(`Color: ${vehicle.color}`, { align: 'center' });
        }
        doc.moveDown(1.5);

        // Separator
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // ── Identification ──────────────────────
        doc.fontSize(14).text('IDENTIFICACIÓN', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Placa: ${vehicle.license_plate}`);
        if (vehicle.vin) doc.text(`VIN: ${vehicle.vin}`);
        if (vehicleType) doc.text(`Tipo: ${vehicleType.name}`);
        doc.moveDown(1.5);

        // ── Specifications ──────────────────────
        doc.fontSize(14).text('ESPECIFICACIONES', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        // Two-column layout for specs
        const specLeft = 50;
        const specRight = 300;
        let specY = doc.y;

        const addSpecRow = (leftLabel: string, leftVal: string, rightLabel?: string, rightVal?: string) => {
          doc.text(`${leftLabel}: ${leftVal}`, specLeft, specY);
          if (rightLabel && rightVal) {
            doc.text(`${rightLabel}: ${rightVal}`, specRight, specY);
          }
          specY += 18;
        };

        addSpecRow(
          'Transmisión', vehicle.transmission || 'N/A',
          'Combustible', vehicle.fuel_type || 'N/A'
        );
        addSpecRow(
          'Kilometraje', `${(vehicle.mileage || 0).toLocaleString()} km`,
          'Condición', vehicle.condition === 'excellent' ? 'Excelente'
            : vehicle.condition === 'good' ? 'Bueno'
            : vehicle.condition === 'fair' ? 'Regular'
            : vehicle.condition === 'poor' ? 'Malo' : vehicle.condition || 'N/A'
        );
        addSpecRow(
          'Premium', vehicle.is_premium ? 'Sí' : 'No',
          'Con chofer', vehicle.has_driver ? 'Sí' : 'No'
        );

        doc.y = specY;
        doc.moveDown(1);

        // ── Financial info ──────────────────────
        doc.fontSize(14).text('INFORMACIÓN COMERCIAL', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        doc.text(`Tarifa diaria: $${(vehicle.daily_rate || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);

        if (vehicleType && vehicleType.daily_rate) {
          doc.text(`Tarifa tipo (${vehicleType.name}): $${vehicleType.daily_rate.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
        }

        doc.moveDown(1.5);

        // ── Location ────────────────────────────
        if (location) {
          doc.fontSize(14).text('UBICACIÓN', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);
          doc.text(`Sede: ${location.name}`);
          if (location.city) doc.text(`Ciudad: ${location.city}`);
          if (location.address) doc.text(`Dirección: ${location.address}`);
          doc.moveDown(1.5);
        }

        // ── Status ──────────────────────────────
        doc.fontSize(14).text('ESTADO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        const statusLabels: Record<string, string> = {
          available: 'Disponible', rented: 'Rentado', maintenance: 'En Mantenimiento'
        };
        doc.text(`Estado actual: ${statusLabels[vehicle.status] || vehicle.status}`);

        if (vehicle.insurance_expiry) {
          doc.text(`Vencimiento de seguro: ${new Date(vehicle.insurance_expiry).toLocaleDateString()}`);
        }
        if (vehicle.next_maintenance) {
          doc.text(`Próximo mantenimiento: ${new Date(vehicle.next_maintenance).toLocaleDateString()}`);
        }
        doc.moveDown(1.5);

        // ── Notes ───────────────────────────────
        if (vehicle.notes) {
          doc.fontSize(14).text('NOTAS', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(9).text(vehicle.notes);
          doc.moveDown(1);
        }

        // ── Footer ──────────────────────────────
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(8).text(
          `Ficha técnica generada por ${configMap.company_name || 'MOVICAR'} el ${new Date().toLocaleString()}`,
          { align: 'center' }
        );
        doc.fontSize(7).text(
          'Este documento es informativo. Precios y disponibilidad sujetos a cambio sin previo aviso.',
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}
