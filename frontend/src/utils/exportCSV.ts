/**
 * Utilidad para exportar datos a CSV (CHAT 2)
 * Soporta múltiples formatos de datos
 */

interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any, row: any) => string;
}

/**
 * Exporta datos a un archivo CSV
 * @param data - Array de objetos a exportar
 * @param columns - Configuración de columnas
 * @param filename - Nombre del archivo (sin extensión)
 */
export const exportToCSV = (
  data: any[],
  columns: ExportColumn[],
  filename: string
): void => {
  if (data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Crear encabezados
  const headers = columns.map(col => `"${col.label}"`).join(',');

  // Crear filas
  const rows = data.map(row => {
    return columns.map(col => {
      let value = getNestedValue(row, col.key);

      // Aplicar formatter si existe
      if (col.formatter) {
        value = col.formatter(value, row);
      }

      // Escapar comillas y envolver en comillas
      if (value === null || value === undefined) {
        return '""';
      }
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  // Combinar encabezados y filas
  const csvContent = [headers, ...rows].join('\n');

  // Agregar BOM para compatibilidad con Excel (caracteres especiales)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Crear link de descarga
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formatDateForFilename(new Date())}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Obtiene un valor anidado de un objeto (ej: "customer.first_name")
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Formatea una fecha para nombre de archivo
 */
const formatDateForFilename = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formatea moneda para CSV
 */
export const formatCurrencyForCSV = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Formatea fecha para CSV
 */
export const formatDateForCSV = (date: string | Date | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Configuraciones predefinidas para exportación

export const RENTALS_COLUMNS: ExportColumn[] = [
  { key: 'rental_code', label: 'Código' },
  { key: 'customer.first_name', label: 'Nombre Cliente' },
  { key: 'customer.last_name', label: 'Apellido Cliente' },
  { key: 'customer.email', label: 'Email Cliente' },
  { key: 'vehicle.brand', label: 'Marca Vehículo' },
  { key: 'vehicle.model', label: 'Modelo Vehículo' },
  { key: 'vehicle.plate', label: 'Placa' },
  { key: 'start_date', label: 'Fecha Inicio', formatter: formatDateForCSV },
  { key: 'end_date', label: 'Fecha Fin', formatter: formatDateForCSV },
  { key: 'days', label: 'Días' },
  { key: 'daily_rate', label: 'Tarifa Diaria', formatter: formatCurrencyForCSV },
  { key: 'total_amount', label: 'Total', formatter: formatCurrencyForCSV },
  { key: 'status', label: 'Estado' }
];

export const RETURNS_COLUMNS: ExportColumn[] = [
  { key: 'return_code', label: 'Código' },
  { key: 'rental.rental_code', label: 'Código Renta' },
  { key: 'rental.customer.first_name', label: 'Nombre Cliente' },
  { key: 'rental.customer.last_name', label: 'Apellido Cliente' },
  { key: 'rental.vehicle.brand', label: 'Marca Vehículo' },
  { key: 'rental.vehicle.model', label: 'Modelo Vehículo' },
  { key: 'rental.vehicle.plate', label: 'Placa' },
  { key: 'return_date', label: 'Fecha Devolución', formatter: formatDateForCSV },
  { key: 'condition', label: 'Condición' },
  { key: 'end_mileage', label: 'Kilometraje Final' },
  { key: 'fuel_level', label: 'Nivel Combustible' },
  { key: 'late_fee', label: 'Cargo por Retraso', formatter: formatCurrencyForCSV },
  { key: 'damage_fee', label: 'Cargo por Daños', formatter: formatCurrencyForCSV },
  { key: 'total_charges', label: 'Total Cargos', formatter: formatCurrencyForCSV }
];

export const PAYMENTS_COLUMNS: ExportColumn[] = [
  { key: 'payment_code', label: 'Código' },
  { key: 'customer.first_name', label: 'Nombre Cliente' },
  { key: 'customer.last_name', label: 'Apellido Cliente' },
  { key: 'invoice.invoice_code', label: 'Código Factura' },
  { key: 'amount', label: 'Monto', formatter: formatCurrencyForCSV },
  { key: 'payment_method', label: 'Método de Pago' },
  { key: 'payment_type', label: 'Tipo de Pago' },
  { key: 'payment_date', label: 'Fecha de Pago', formatter: formatDateForCSV },
  { key: 'reference_number', label: 'Referencia' },
  { key: 'status', label: 'Estado' }
];
