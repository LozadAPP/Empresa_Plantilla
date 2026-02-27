import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Rental from '../models/Rental';
import Customer from '../models/Customer';
import Vehicle from '../models/Vehicle';
import Location from '../models/Location';
import Invoice from '../models/Invoice';
import Quote from '../models/Quote';
import VehicleType from '../models/VehicleType';
import SystemConfig from '../models/SystemConfig';

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
