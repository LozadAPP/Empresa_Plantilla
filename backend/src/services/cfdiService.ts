import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs/promises';
import logger from '../config/logger';
import { Invoice, InvoiceLineItem, Rental, RentalService, ExtraService, Customer, SystemConfig } from '../models';
import { PAYMENT_METHOD_TO_SAT } from '../constants/satCatalogs';

const XML_STORAGE_PATH = path.join(__dirname, '../../storage/xml');

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface FiscalConfig {
  company_rfc: string;
  company_razon_social: string;
  company_regimen_fiscal: string;
  company_zip_code: string;
  company_address: string;
  cfdi_pac_provider: string;
  cfdi_default_tax_rate: string;
  [key: string]: string;
}

/**
 * Carga la configuración fiscal de la empresa desde system_configs
 */
async function loadFiscalConfig(): Promise<FiscalConfig> {
  const configs = await SystemConfig.findAll({
    where: { category: 'fiscal' },
  });
  const map: Record<string, string> = {};
  for (const c of configs) {
    map[c.configKey] = c.configValue;
  }
  return map as FiscalConfig;
}

/**
 * Valida que una factura tenga todos los datos necesarios para CFDI
 */
async function validateInvoiceForCFDI(invoiceId: number): Promise<ValidationResult> {
  const errors: string[] = [];

  const invoice = await Invoice.findByPk(invoiceId, {
    include: [
      { model: Customer, as: 'customer' },
      { model: InvoiceLineItem, as: 'lineItems' },
    ],
  });

  if (!invoice) {
    return { valid: false, errors: ['Factura no encontrada'] };
  }

  if (invoice.cfdi_status === 'stamped') {
    return { valid: false, errors: ['La factura ya está timbrada'] };
  }

  // Validar cliente
  const customer = (invoice as any).customer;
  if (!customer) {
    errors.push('La factura no tiene cliente asociado');
  } else {
    if (!customer.rfc) errors.push('El cliente no tiene RFC registrado');
    if (!customer.regimen_fiscal) errors.push('El cliente no tiene régimen fiscal');
    if (!customer.zip_code) errors.push('El cliente no tiene código postal fiscal');
  }

  // Validar líneas
  const lineItems = (invoice as any).lineItems || [];
  if (lineItems.length === 0) {
    errors.push('La factura no tiene líneas de detalle (conceptos)');
  }

  // Validar config empresa
  const config = await loadFiscalConfig();
  if (!config.company_rfc) errors.push('No se ha configurado el RFC de la empresa');
  if (!config.company_regimen_fiscal) errors.push('No se ha configurado el régimen fiscal de la empresa');
  if (!config.company_zip_code) errors.push('No se ha configurado el código postal de la empresa');

  return { valid: errors.length === 0, errors };
}

/**
 * Obtiene el código SAT FormaPago a partir del método de pago interno
 */
function getFormaPagoCode(paymentMethod: string): string {
  return PAYMENT_METHOD_TO_SAT[paymentMethod] || '99';
}

/**
 * Obtiene el siguiente folio disponible para una serie
 */
async function getNextFolio(serie: string = 'A'): Promise<number> {
  const maxFolio = await Invoice.max('folio', {
    where: { serie },
  }) as number | null;
  return (maxFolio || 0) + 1;
}

/**
 * Genera XML CFDI 4.0 (estructura completa, sin firma criptográfica real)
 */
function generateXML(params: {
  uuid: string;
  serie: string;
  folio: number;
  stampDate: string;
  invoice: any;
  customer: any;
  lineItems: any[];
  config: FiscalConfig;
}): string {
  const { uuid, serie, folio, stampDate, invoice, customer, lineItems, config } = params;

  const conceptos = lineItems.map(item => `
      <cfdi:Concepto
        ClaveProdServ="${item.satProductCode}"
        NoIdentificacion="${item.id}"
        Cantidad="${Number(item.quantity).toFixed(4)}"
        ClaveUnidad="${item.unitCode}"
        Descripcion="${escapeXml(item.description)}"
        ValorUnitario="${Number(item.unitPrice).toFixed(2)}"
        Importe="${Number(item.subtotal).toFixed(2)}"
        Descuento="${Number(item.discount).toFixed(2)}"
        ObjetoImp="02">
        <cfdi:Impuestos>
          <cfdi:Traslados>
            <cfdi:Traslado
              Base="${(Number(item.subtotal) - Number(item.discount)).toFixed(2)}"
              Impuesto="002"
              TipoFactor="Tasa"
              TasaOCuota="${(Number(item.taxRate) / 100).toFixed(6)}"
              Importe="${Number(item.taxAmount).toFixed(2)}"/>
          </cfdi:Traslados>
        </cfdi:Impuestos>
      </cfdi:Concepto>`).join('');

  const totalImpuestos = lineItems.reduce((sum: number, item: any) => sum + Number(item.taxAmount), 0);
  const totalSubtotal = lineItems.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
  const totalDescuento = lineItems.reduce((sum: number, item: any) => sum + Number(item.discount), 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"
  Version="4.0"
  Serie="${serie}"
  Folio="${folio}"
  Fecha="${stampDate}"
  FormaPago="${invoice.payment_form_code || '99'}"
  NoCertificado="00000000000000000000"
  SubTotal="${totalSubtotal.toFixed(2)}"
  Descuento="${totalDescuento.toFixed(2)}"
  Moneda="${invoice.currency_code || 'MXN'}"
  TipoCambio="${Number(invoice.exchange_rate || 1).toFixed(4)}"
  Total="${Number(invoice.total_amount).toFixed(2)}"
  TipoDeComprobante="I"
  MetodoPago="${invoice.payment_method_code || 'PUE'}"
  LugarExpedicion="${config.company_zip_code}"
  Exportacion="01"
  Sello="SIMULADO_SIN_SELLO_REAL"
  Certificado="SIMULADO_SIN_CERTIFICADO_REAL">

  <cfdi:Emisor
    Rfc="${config.company_rfc}"
    Nombre="${escapeXml(config.company_razon_social)}"
    RegimenFiscal="${config.company_regimen_fiscal}"/>

  <cfdi:Receptor
    Rfc="${customer.rfc}"
    Nombre="${escapeXml(customer.name)}"
    DomicilioFiscalReceptor="${customer.zip_code}"
    RegimenFiscalReceptor="${customer.regimen_fiscal}"
    UsoCFDI="${invoice.uso_cfdi || 'G03'}"/>

  <cfdi:Conceptos>${conceptos}
  </cfdi:Conceptos>

  <cfdi:Impuestos TotalImpuestosTrasladados="${totalImpuestos.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado
        Base="${(totalSubtotal - totalDescuento).toFixed(2)}"
        Impuesto="002"
        TipoFactor="Tasa"
        TasaOCuota="0.160000"
        Importe="${totalImpuestos.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>

  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital
      xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
      xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd"
      Version="1.1"
      UUID="${uuid}"
      FechaTimbrado="${stampDate}"
      RfcProvCertif="SPR190613I52"
      SelloCFD="SIMULADO"
      NoCertificadoSAT="00000000000000000000"
      SelloSAT="SIMULADO"/>
  </cfdi:Complemento>

</cfdi:Comprobante>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera la cadena de datos para el código QR del CFDI
 */
function generateQRData(uuid: string, companyRfc: string, customerRfc: string, total: number): string {
  return `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuid}&re=${companyRfc}&rr=${customerRfc}&tt=${total.toFixed(6)}&fe=SIMULADO`;
}

/**
 * TIMBRA una factura (MODO SIMULADO — sin conexión real a PAC)
 */
async function stampInvoice(invoiceId: number): Promise<{ success: boolean; message: string; invoice?: any }> {
  // 1. Validar
  const validation = await validateInvoiceForCFDI(invoiceId);
  if (!validation.valid) {
    return { success: false, message: `Validación CFDI fallida: ${validation.errors.join(', ')}` };
  }

  // 2. Cargar datos completos
  const invoice = await Invoice.findByPk(invoiceId, {
    include: [
      { model: Customer, as: 'customer' },
      { model: InvoiceLineItem, as: 'lineItems' },
    ],
  });
  if (!invoice) {
    return { success: false, message: 'Factura no encontrada' };
  }

  const customer = (invoice as any).customer;
  const lineItems = (invoice as any).lineItems || [];
  const config = await loadFiscalConfig();

  // 3. Generar UUID y folio
  const uuid = randomUUID();
  const serie = invoice.serie || 'A';
  const folio = await getNextFolio(serie);
  const stampDate = new Date().toISOString().replace('Z', '');

  // 4. Generar XML
  const xmlContent = generateXML({
    uuid, serie, folio, stampDate,
    invoice, customer, lineItems, config,
  });

  // 5. Guardar XML en storage
  await fs.mkdir(XML_STORAGE_PATH, { recursive: true });
  const xmlFileName = `CFDI_${serie}${folio}_${uuid}.xml`;
  const xmlFilePath = path.join(XML_STORAGE_PATH, xmlFileName);
  await fs.writeFile(xmlFilePath, xmlContent, 'utf-8');

  // 6. Generar QR data
  const qrData = generateQRData(uuid, config.company_rfc, customer.rfc, Number(invoice.total_amount));

  // 7. Actualizar factura
  await invoice.update({
    uuid,
    serie,
    folio,
    cfdi_status: 'stamped' as any,
    stamp_date: new Date(),
    xml_url: `/storage/xml/${xmlFileName}`,
    qr_data: qrData,
  });

  logger.info(`CFDI timbrado (simulado): Invoice #${invoice.invoice_code}, UUID: ${uuid}, Serie: ${serie}, Folio: ${folio}`);

  // Reload with associations
  const updated = await Invoice.findByPk(invoiceId, {
    include: [
      { model: Customer, as: 'customer' },
      { model: InvoiceLineItem, as: 'lineItems' },
    ],
  });

  return { success: true, message: `CFDI timbrado exitosamente (modo simulado). UUID: ${uuid}`, invoice: updated };
}

/**
 * CANCELA un CFDI timbrado (MODO SIMULADO)
 */
async function cancelInvoice(invoiceId: number, cancelReason: string): Promise<{ success: boolean; message: string }> {
  const invoice = await Invoice.findByPk(invoiceId);
  if (!invoice) {
    return { success: false, message: 'Factura no encontrada' };
  }
  if (invoice.cfdi_status !== 'stamped') {
    return { success: false, message: 'Solo se pueden cancelar facturas timbradas' };
  }
  if (!['01', '02', '03', '04'].includes(cancelReason)) {
    return { success: false, message: 'Motivo de cancelación inválido (use 01-04)' };
  }

  await invoice.update({
    cfdi_status: 'cancelled' as any,
    cancel_date: new Date(),
    cancel_reason: cancelReason,
  });

  logger.info(`CFDI cancelado (simulado): Invoice #${invoice.invoice_code}, UUID: ${invoice.uuid}, Motivo: ${cancelReason}`);

  return { success: true, message: `CFDI cancelado exitosamente (modo simulado). Motivo: ${cancelReason}` };
}

/**
 * Genera líneas de detalle automáticamente desde los datos de una renta
 */
async function generateLineItemsFromRental(invoiceId: number, rentalId: number): Promise<void> {
  const rental = await Rental.findByPk(rentalId, {
    include: [
      {
        model: RentalService,
        as: 'services',
        include: [{ model: ExtraService, as: 'extraService' }],
      },
    ],
  });

  if (!rental) {
    throw new Error(`Renta #${rentalId} no encontrada`);
  }

  const config = await loadFiscalConfig();
  const taxRate = Number(config.cfdi_default_tax_rate) || 16;
  const items: any[] = [];
  let sortOrder = 0;

  // Línea 1: Renta del vehículo
  const rentalSubtotal = Number(rental.daily_rate) * rental.days;
  const rentalDiscount = Number(rental.discount_amount || 0);
  const rentalTaxable = rentalSubtotal - rentalDiscount;
  const rentalTax = rentalTaxable * (taxRate / 100);
  items.push({
    invoiceId: invoiceId,
    description: `Renta de vehículo — ${rental.days} día(s)`,
    quantity: rental.days,
    unitCode: 'DAY',
    unitPrice: Number(rental.daily_rate),
    discount: rentalDiscount,
    subtotal: rentalSubtotal,
    taxRate,
    taxAmount: Math.round(rentalTax * 100) / 100,
    total: Math.round((rentalTaxable + rentalTax) * 100) / 100,
    satProductCode: '78111802',
    sortOrder: sortOrder++,
  });

  // Línea 2: Seguro (si aplica)
  if (rental.insurance_amount && Number(rental.insurance_amount) > 0) {
    const insAmt = Number(rental.insurance_amount);
    const insTax = insAmt * (taxRate / 100);
    items.push({
      invoiceId: invoiceId,
      description: 'Seguro de vehículo',
      quantity: 1,
      unitCode: 'E48',
      unitPrice: insAmt,
      discount: 0,
      subtotal: insAmt,
      taxRate,
      taxAmount: Math.round(insTax * 100) / 100,
      total: Math.round((insAmt + insTax) * 100) / 100,
      satProductCode: '84111506',
      sortOrder: sortOrder++,
    });
  }

  // Líneas adicionales: Servicios extra
  const services = (rental as any).services || [];
  for (const svc of services) {
    const extraService = svc.extraService;
    const svcSubtotal = Number(svc.subtotal);
    const svcTax = svcSubtotal * (taxRate / 100);
    items.push({
      invoiceId: invoiceId,
      description: extraService ? extraService.name : `Servicio extra #${svc.extra_service_id}`,
      quantity: svc.quantity,
      unitCode: 'E48',
      unitPrice: Number(svc.unit_price),
      discount: 0,
      subtotal: svcSubtotal,
      taxRate,
      taxAmount: Math.round(svcTax * 100) / 100,
      total: Math.round((svcSubtotal + svcTax) * 100) / 100,
      satProductCode: '78111802',
      sortOrder: sortOrder++,
    });
  }

  // Bulk create
  if (items.length > 0) {
    await InvoiceLineItem.bulkCreate(items);
    logger.info(`Generadas ${items.length} líneas de detalle para factura #${invoiceId} desde renta #${rentalId}`);
  }
}

/**
 * Obtiene la ruta del archivo XML de una factura
 */
async function getXMLFilePath(invoiceId: number): Promise<string | null> {
  const invoice = await Invoice.findByPk(invoiceId);
  if (!invoice || !invoice.xml_url) return null;
  const fileName = path.basename(invoice.xml_url);
  return path.join(XML_STORAGE_PATH, fileName);
}

export const cfdiService = {
  validateInvoiceForCFDI,
  getFormaPagoCode,
  getNextFolio,
  generateXML,
  generateQRData,
  stampInvoice,
  cancelInvoice,
  generateLineItemsFromRental,
  getXMLFilePath,
  loadFiscalConfig,
};

export default cfdiService;
