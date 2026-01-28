# Componentes Reutilizables - CHAT 2

## 📁 Estructura

```
components/
├── rentals/
│   ├── RentalTable.tsx       # Tabla de rentas con paginación
│   ├── RentalCard.tsx        # Tarjeta de renta
│   ├── RentalFilters.tsx     # Filtros de búsqueda
│   ├── RentalStatusChip.tsx  # Chip de estado
│   └── index.ts              # Exports
├── returns/
│   ├── ReturnInspection.tsx  # Formulario de inspección
│   ├── PenaltyCalculator.tsx # Calculadora de penalidades
│   └── index.ts              # Exports
└── payments/
    ├── PaymentTable.tsx      # Tabla de pagos
    ├── InvoiceDownload.tsx   # Descarga de facturas
    └── index.ts              # Exports
```

---

## 🚗 Componentes de Rentals

### RentalTable

Tabla completa de rentas con paginación, acciones y menú contextual.

```tsx
import { RentalTable } from '@/components/rentals';

<RentalTable
  rentals={rentals}
  loading={loading}
  pagination={{
    page: 1,
    pages: 10,
    total: 100,
    limit: 10
  }}
  onPageChange={(page) => setPage(page)}
  onRowsPerPageChange={(limit) => setLimit(limit)}
  onEdit={(rental) => handleEdit(rental)}
  onCancel={(rental) => handleCancel(rental)}
/>
```

**Props:**
- `rentals`: Rental[] - Array de rentas
- `loading?`: boolean - Estado de carga
- `pagination?`: Object - Objeto de paginación
- `onPageChange?`: (page: number) => void
- `onRowsPerPageChange?`: (limit: number) => void
- `onEdit?`: (rental: Rental) => void
- `onCancel?`: (rental: Rental) => void

---

### RentalCard

Tarjeta visual de renta para vistas de cuadrícula.

```tsx
import { RentalCard } from '@/components/rentals';

<RentalCard
  rental={rental}
  onMenuClick={(event, rental) => handleMenu(event, rental)}
/>
```

**Props:**
- `rental`: Rental - Objeto de renta
- `onMenuClick?`: (event, rental) => void - Handler para menú

---

### RentalFilters

Componente de filtros avanzados para rentas.

```tsx
import { RentalFilters } from '@/components/rentals';

const [filters, setFilters] = useState({
  status: '',
  search: '',
  startDate: '',
  endDate: ''
});

<RentalFilters
  filters={filters}
  onChange={(key, value) => setFilters({ ...filters, [key]: value })}
  onClear={() => setFilters({ status: '', search: '', startDate: '', endDate: '' })}
/>
```

**Props:**
- `filters`: RentalFilterValues - Valores actuales de filtros
- `onChange`: (key: string, value: any) => void
- `onClear?`: () => void - Handler para limpiar filtros

---

### RentalStatusChip

Chip de estado con color e icono correspondiente.

```tsx
import { RentalStatusChip } from '@/components/rentals';

<RentalStatusChip status="active" size="small" />
```

**Props:**
- `status`: RentalStatus - Estado de la renta
- `size?`: 'small' | 'medium' - Tamaño del chip

**Estados disponibles:**
- `active` - Verde con icono de play
- `reserved` - Azul con icono de reloj
- `completed` - Gris con icono de check
- `cancelled` - Rojo con icono de cancel
- `overdue` - Naranja con icono de warning

---

## 🔄 Componentes de Returns

### ReturnInspection

Formulario completo de inspección de vehículo devuelto.

```tsx
import { ReturnInspection } from '@/components/returns';

const [formData, setFormData] = useState({
  end_mileage: 0,
  fuel_level: 'full',
  vehicle_condition: 'excellent',
  damage_description: '',
  damage_cost: 0,
  cleaning_required: false,
  inspection_notes: ''
});

<ReturnInspection
  formData={formData}
  onChange={(field, value) => setFormData({ ...formData, [field]: value })}
  startMileage={rental.start_mileage}
/>
```

**Props:**
- `formData`: InspectionData - Datos del formulario
- `onChange`: (field: string, value: any) => void
- `startMileage?`: number - Kilometraje inicial para validación

---

### PenaltyCalculator

Calculadora automática de penalidades con desglose visual.

```tsx
import { PenaltyCalculator } from '@/components/returns';

<PenaltyCalculator
  expectedEndDate={rental.end_date}
  actualEndDate={new Date()}
  dailyRate={rental.daily_rate}
  cleaningRequired={formData.cleaning_required}
  damageCost={formData.damage_cost}
  lateFeeMultiplier={1.5}
  cleaningCost={50}
/>
```

**Props:**
- `expectedEndDate`: Date | string - Fecha esperada de devolución
- `actualEndDate?`: Date | string - Fecha real (default: hoy)
- `dailyRate`: number - Tarifa diaria
- `cleaningRequired?`: boolean - Si requiere limpieza
- `damageCost?`: number - Costo de daños
- `lateFeeMultiplier?`: number - Multiplicador de retraso (default: 1.5)
- `cleaningCost?`: number - Costo de limpieza (default: 50)

**Cálculos automáticos:**
- Días de retraso
- Penalidad por retraso = días × tarifa × multiplicador
- Cargo por limpieza (si aplica)
- Costo de daños
- **Total de penalidades**

---

## 💳 Componentes de Payments

### PaymentTable

Tabla de pagos con información completa.

```tsx
import { PaymentTable } from '@/components/payments';

<PaymentTable
  payments={payments}
  pagination={{
    page: 1,
    pages: 5,
    total: 50,
    limit: 10
  }}
  onPageChange={(page) => setPage(page)}
  onRowsPerPageChange={(limit) => setLimit(limit)}
/>
```

**Props:**
- `payments`: Payment[] - Array de pagos
- `pagination?`: Object - Objeto de paginación
- `onPageChange?`: (page: number) => void
- `onRowsPerPageChange?`: (limit: number) => void

**Características:**
- Chips de tipo de pago con colores
- Chips de estado de pago
- Formateo de moneda
- Formateo de fechas
- Click para ver detalles

---

### InvoiceDownload

Componente para descargar y enviar facturas por email.

```tsx
import { InvoiceDownload } from '@/components/payments';

// Variante botón
<InvoiceDownload
  invoiceId={invoice.id}
  invoiceCode={invoice.invoice_code}
  pdfUrl={invoice.pdf_url}
  variant="button"
  showEmail={true}
  customerEmail={invoice.customer.email}
/>

// Variante icono
<InvoiceDownload
  invoiceId={invoice.id}
  pdfUrl={invoice.pdf_url}
  variant="icon"
  showEmail={false}
/>
```

**Props:**
- `invoiceId`: number - ID de la factura
- `invoiceCode?`: string - Código de factura (para nombre del archivo)
- `pdfUrl?`: string - URL del PDF (si ya existe)
- `variant?`: 'icon' | 'button' - Variante visual (default: 'button')
- `showEmail?`: boolean - Mostrar botón de email (default: true)
- `customerEmail?`: string - Email del cliente

**Funcionalidades:**
- Descarga de PDF (abre en nueva pestaña si existe URL)
- Descarga como archivo si no hay URL (genera PDF)
- Envío por email con confirmación
- Estados de carga (downloading, sending)
- Snackbar de feedback

---

## 🎨 Personalización

Todos los componentes usan **Material-UI** y respetan el tema configurado en la aplicación.

### Colores por defecto:

**Estados de renta:**
- Active: `success` (verde)
- Reserved: `info` (azul)
- Completed: `default` (gris)
- Cancelled: `error` (rojo)
- Overdue: `warning` (naranja)

**Tipos de pago:**
- Rental Payment: `#8b5cf6` (morado)
- Deposit: `#3b82f6` (azul)
- Penalty: `#ef4444` (rojo)
- Refund: `#10b981` (verde)

---

## 📝 Ejemplos de Uso Completo

### Página de Rentas

```tsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { RentalTable, RentalFilters } from '@/components/rentals';
import { fetchRentals } from '@/store/slices/rentalSlice';

export default function RentalsPage() {
  const dispatch = useDispatch();
  const { rentals, loading, pagination } = useSelector(state => state.rentals);

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    dispatch(fetchRentals(filters));
  }, [filters]);

  return (
    <Box>
      <RentalFilters
        filters={filters}
        onChange={(key, value) => setFilters({ ...filters, [key]: value })}
        onClear={() => setFilters({ status: '', search: '', startDate: '', endDate: '' })}
      />

      <RentalTable
        rentals={rentals}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onEdit={(rental) => navigate(`/rentals/${rental.id}/edit`)}
        onCancel={(rental) => handleCancel(rental)}
      />
    </Box>
  );
}
```

### Formulario de Devolución

```tsx
import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { ReturnInspection, PenaltyCalculator } from '@/components/returns';

export default function ReturnFormPage() {
  const [formData, setFormData] = useState({
    end_mileage: 0,
    fuel_level: 'full',
    vehicle_condition: 'excellent',
    damage_description: '',
    damage_cost: 0,
    cleaning_required: false,
    inspection_notes: ''
  });

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      {/* Formulario de inspección */}
      <ReturnInspection
        formData={formData}
        onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        startMileage={rental.start_mileage}
      />

      {/* Calculadora de penalidades */}
      <PenaltyCalculator
        expectedEndDate={rental.end_date}
        actualEndDate={new Date()}
        dailyRate={rental.daily_rate}
        cleaningRequired={formData.cleaning_required}
        damageCost={formData.damage_cost}
      />
    </Box>
  );
}
```

---

## 🚀 Tips de Rendimiento

1. **Memoización**: Los componentes usan React.memo internamente cuando es necesario
2. **Lazy Loading**: Considera usar React.lazy para cargar componentes grandes
3. **Paginación**: Siempre usa paginación para listas grandes
4. **Virtualización**: Para listas muy grandes (1000+ items), considera react-window

---

**Creado por:** Claude Code - CHAT 2
**Última actualización:** 20 de diciembre de 2024
