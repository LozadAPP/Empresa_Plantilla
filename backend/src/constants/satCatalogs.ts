/**
 * Catálogos SAT para CFDI 4.0
 * Fuente: http://omawww.sat.gob.mx/tramitesyservicios/Paginas/catalogos_702.htm
 */

// c_FormaPago — Forma de Pago
export const SAT_FORMA_PAGO: Record<string, string> = {
  '01': 'Efectivo',
  '02': 'Cheque nominativo',
  '03': 'Transferencia electrónica de fondos',
  '04': 'Tarjeta de crédito',
  '28': 'Tarjeta de débito',
  '99': 'Por definir',
};

// c_MetodoPago — Método de Pago
export const SAT_METODO_PAGO: Record<string, string> = {
  'PUE': 'Pago en Una Exhibición',
  'PPD': 'Pago en Parcialidades o Diferido',
};

// c_UsoCFDI — Uso del CFDI
export const SAT_USO_CFDI: Record<string, string> = {
  'G01': 'Adquisición de mercancías',
  'G03': 'Gastos en general',
  'P01': 'Por definir',
  'S01': 'Sin efectos fiscales',
};

// c_RegimenFiscal — Régimen Fiscal
export const SAT_REGIMEN_FISCAL: Record<string, string> = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
  '616': 'Sin obligaciones fiscales',
  '625': 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
  '626': 'Régimen Simplificado de Confianza',
};

// c_ClaveProdServ — Clave de Producto o Servicio
export const SAT_CLAVE_PROD_SERV: Record<string, string> = {
  '78111802': 'Alquiler de automóviles',
  '78111803': 'Alquiler de camionetas o vans',
  '84111506': 'Servicios de seguros para automóviles',
  '78111808': 'Alquiler de vehículos de carga',
  '80131502': 'Servicios de alquiler de oficinas',
  '01010101': 'No existe en el catálogo',
};

// c_ClaveUnidad — Clave de Unidad de Medida
export const SAT_CLAVE_UNIDAD: Record<string, string> = {
  'E48': 'Unidad de Servicio',
  'DAY': 'Día',
  'ACT': 'Actividad',
  'HUR': 'Hora',
  'MON': 'Mes',
  'H87': 'Pieza',
};

// c_MotivoCancelacion — Motivo de Cancelación
export const SAT_MOTIVO_CANCELACION: Record<string, string> = {
  '01': 'Comprobante emitido con errores con relación',
  '02': 'Comprobante emitido con errores sin relación',
  '03': 'No se llevó a cabo la operación',
  '04': 'Operación nominativa relacionada en una factura global',
};

// Mapeo interno → código SAT FormaPago
export const PAYMENT_METHOD_TO_SAT: Record<string, string> = {
  'cash': '01',
  'check': '02',
  'bank_transfer': '03',
  'credit_card': '04',
  'debit_card': '28',
  'other': '99',
};

// Monedas frecuentes
export const SAT_MONEDA: Record<string, string> = {
  'MXN': 'Peso Mexicano',
  'USD': 'Dólar Americano',
  'EUR': 'Euro',
};
