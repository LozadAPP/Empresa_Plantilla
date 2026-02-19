import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Rental from '../models/Rental';
import Customer from '../models/Customer';
import Vehicle from '../models/Vehicle';
import Location from '../models/Location';
import Invoice from '../models/Invoice';
import SystemConfig from '../models/SystemConfig';

/**
 * Servicio para generar PDFs (Contratos y Facturas)
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
   * Genera una factura en PDF
   */
  static async generateInvoice(invoice: Invoice): Promise<string> {
    this.initialize();

    // Obtener datos relacionados
    const rental = await Rental.findByPk(invoice.rental_id);
    const customer = await Customer.findByPk(invoice.customer_id);

    if (!rental || !customer) {
      throw new Error('Datos incompletos para generar factura');
    }

    const fileName = `invoice-${invoice.invoice_code}.pdf`;
    const filePath = path.join(this.STORAGE_PATH, fileName);

    // Leer datos de empresa desde system_configs
    const companyConfigs = await SystemConfig.findAll({
      where: { configKey: ['company_name', 'company_rfc', 'company_address'] }
    });
    const configMap = Object.fromEntries(companyConfigs.map(c => [c.configKey, c.configValue]));

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Encabezado
        doc.fontSize(24).text('FACTURA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Factura No: ${invoice.invoice_code}`, { align: 'center' });
        doc.moveDown(2);

        // Información de la empresa
        doc.fontSize(14).text(configMap.company_name || 'MOVICAR', { underline: true });
        doc.fontSize(10);
        doc.text(`RFC: ${configMap.company_rfc || ''}`);
        doc.text(`Dirección: ${configMap.company_address || ''}`);
        doc.moveDown(1);

        // Información del cliente
        doc.fontSize(12).text('FACTURAR A:', { underline: true });
        doc.fontSize(10);
        doc.text(`${customer.name}`);
        doc.text(`${customer.email}`);
        if (customer.address) doc.text(`${customer.address}`);
        doc.moveDown(1.5);

        // Detalles de la factura
        doc.fontSize(10);
        doc.text(`Fecha de emisión: ${new Date(invoice.issue_date).toLocaleDateString()}`);
        doc.text(`Fecha de vencimiento: ${new Date(invoice.due_date).toLocaleDateString()}`);
        doc.text(`Relacionado a renta: ${rental.rental_code}`);
        doc.moveDown(1.5);

        // Tabla de conceptos
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
        doc.text(`Renta de vehículo (${rental.days} días)`, 50, doc.y);
        doc.text(`$${invoice.subtotal}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(0.8);

        if (invoice.discount_amount && invoice.discount_amount > 0) {
          doc.text('Descuento', 50, doc.y);
          doc.text(`-$${invoice.discount_amount}`, 400, doc.y, { width: 90, align: 'right' });
          doc.moveDown(0.8);
        }

        doc.text('IVA', 50, doc.y);
        doc.text(`$${invoice.tax_amount}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(0.8);

        // Line
        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(0.5);

        // Total
        doc.fontSize(12).text('TOTAL', 50, doc.y);
        doc.text(`$${invoice.total_amount}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(1);

        // Pagado/Pendiente
        const paidAmount = invoice.paid_amount || 0;
        doc.fontSize(10).text('Pagado', 50, doc.y);
        doc.text(`$${paidAmount}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(0.5);

        doc.fontSize(12).text('SALDO', 50, doc.y, { underline: true });
        doc.text(`$${invoice.balance}`, 400, doc.y, { width: 90, align: 'right' });
        doc.moveDown(2);

        // Notas
        if (invoice.notes) {
          doc.fontSize(10).text('Notas:', { underline: true });
          doc.fontSize(9).text(invoice.notes);
          doc.moveDown(1);
        }

        // Footer
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
}
