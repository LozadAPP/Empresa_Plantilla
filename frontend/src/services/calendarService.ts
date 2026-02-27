/**
 * Servicio de Calendario — Agrega eventos de 5 entidades existentes
 * No crea endpoints nuevos, usa los existentes con filtros de fecha
 */
import { rentalService } from './rentalService';
import { maintenanceService } from './maintenanceService';
import { quoteService } from './quoteService';
import { vehicleService } from './vehicleService';
import { CalendarEvent, CalendarFilters, CALENDAR_COLORS } from '../types/calendar';
import { Rental, RentalStatus } from '../types/rental';
import { MaintenanceOrder } from '../types/maintenance';
import { Quote } from '../types/quote';
import { Vehicle } from '../types';
import { format, addDays, subDays } from 'date-fns';

// ── Transformer: Rentals ──────────────────────────────────

function transformRentals(rentals: Rental[]): CalendarEvent[] {
  return rentals.map((r) => {
    const color =
      CALENDAR_COLORS.rental[r.status as keyof typeof CALENDAR_COLORS.rental] ||
      CALENDAR_COLORS.rental.active;

    const vehicle = r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'Vehículo';
    const customer = r.customer?.name || '';

    const startStr = String(r.start_date).split('T')[0];
    const endDate = addDays(new Date(String(r.end_date).split('T')[0]), 1);

    return {
      id: `rental-${r.id}`,
      title: `${r.rental_code} · ${vehicle}`,
      start: startStr,
      end: format(endDate, 'yyyy-MM-dd'),
      allDay: true,
      color,
      textColor: '#ffffff',
      borderColor: color,
      type: 'rental',
      entityId: r.id,
      entityPath: `/rentals/${r.id}`,
      metadata: {
        rentalCode: r.rental_code,
        status: r.status,
        customerName: customer,
        vehicleName: vehicle,
        licensePlate: r.vehicle?.license_plate,
        totalAmount: r.total_amount,
        dailyRate: r.daily_rate,
        days: r.days,
        startDate: r.start_date,
        endDate: r.end_date,
      },
    };
  });
}

// ── Transformer: Maintenance Orders ───────────────────────

function transformMaintenanceOrders(orders: MaintenanceOrder[]): CalendarEvent[] {
  return orders.map((o) => {
    const color =
      CALENDAR_COLORS.maintenance[o.priority as keyof typeof CALENDAR_COLORS.maintenance] ||
      CALENDAR_COLORS.maintenance.scheduled;

    const vehicle = o.vehicle
      ? `${o.vehicle.make} ${o.vehicle.model}`
      : 'Vehículo';

    return {
      id: `maint-${o.id}`,
      title: `🔧 ${vehicle} (${o.vehicle?.licensePlate || ''})`,
      start: String(o.scheduledDate).split('T')[0],
      allDay: true,
      color,
      textColor: '#ffffff',
      borderColor: color,
      type: 'maintenance',
      entityId: o.id,
      entityPath: '/maintenance',
      metadata: {
        maintenanceCode: o.maintenanceCode,
        status: o.status,
        priority: o.priority,
        vehicleName: vehicle,
        licensePlate: o.vehicle?.licensePlate,
        typeName: o.maintenanceType?.name,
        workshopName: o.workshopName,
        technicianName: o.technicianName,
        scheduledDate: o.scheduledDate,
      },
    };
  });
}

// ── Transformer: Quotes ───────────────────────────────────

function transformQuotes(quotes: Quote[]): CalendarEvent[] {
  return quotes
    .filter((q) => q.valid_until && q.status !== 'converted')
    .map((q) => {
      const color =
        CALENDAR_COLORS.quote[q.status as keyof typeof CALENDAR_COLORS.quote] ||
        CALENDAR_COLORS.quote.draft;

      const customer = q.customer?.name || 'Cliente';

      return {
        id: `quote-${q.id}`,
        title: `📋 ${q.quote_code} vence · ${customer}`,
        start: String(q.valid_until).split('T')[0],
        allDay: true,
        color,
        textColor: '#ffffff',
        borderColor: color,
        type: 'quote',
        entityId: q.id,
        entityPath: `/quotes/${q.id}`,
        metadata: {
          quoteCode: q.quote_code,
          status: q.status,
          customerName: customer,
          vehicleName: q.vehicle ? `${q.vehicle.make} ${q.vehicle.model}` : undefined,
          totalAmount: q.total_amount,
          validUntil: q.valid_until,
        },
      };
    });
}

// ── Transformer: Vehicle Alerts ───────────────────────────

function transformVehicleAlerts(
  vehicles: Vehicle[],
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);

  for (const v of vehicles) {
    if (v.insurance_expiry) {
      const d = new Date(v.insurance_expiry);
      if (d >= start && d <= end) {
        events.push({
          id: `valert-ins-${v.id}`,
          title: `🛡️ Seguro vence · ${v.make} ${v.model} (${v.license_plate})`,
          start: String(v.insurance_expiry).split('T')[0],
          allDay: true,
          color: CALENDAR_COLORS.vehicleAlert.insurance,
          textColor: '#ffffff',
          borderColor: CALENDAR_COLORS.vehicleAlert.insurance,
          type: 'vehicle_alert',
          entityId: v.id,
          entityPath: `/inventory/${v.id}`,
          metadata: {
            alertType: 'insurance_expiry',
            vehicleName: `${v.make} ${v.model}`,
            licensePlate: v.license_plate,
            expiryDate: v.insurance_expiry,
          },
        });
      }
    }

    if (v.next_maintenance) {
      const d = new Date(v.next_maintenance);
      if (d >= start && d <= end) {
        events.push({
          id: `valert-maint-${v.id}`,
          title: `⚙️ Mant. programado · ${v.make} ${v.model} (${v.license_plate})`,
          start: String(v.next_maintenance).split('T')[0],
          allDay: true,
          color: CALENDAR_COLORS.vehicleAlert.maintenance,
          textColor: '#ffffff',
          borderColor: CALENDAR_COLORS.vehicleAlert.maintenance,
          type: 'vehicle_alert',
          entityId: v.id,
          entityPath: `/inventory/${v.id}`,
          metadata: {
            alertType: 'next_maintenance',
            vehicleName: `${v.make} ${v.model}`,
            licensePlate: v.license_plate,
            maintenanceDate: v.next_maintenance,
          },
        });
      }
    }
  }

  return events;
}

// ── Transformer: Returns (expected) ──────────────────────

function transformReturns(rentals: Rental[]): CalendarEvent[] {
  return rentals
    .filter((r) => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE)
    .map((r) => {
      const isOverdue = r.status === RentalStatus.OVERDUE;
      const color = isOverdue ? CALENDAR_COLORS.return.overdue : CALENDAR_COLORS.return.due;
      const vehicle = r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'Vehículo';
      const customer = r.customer?.name || '';

      return {
        id: `return-${r.id}`,
        title: `↩ Devolución · ${vehicle} · ${customer}`,
        start: String(r.end_date).split('T')[0],
        allDay: true,
        color,
        textColor: '#ffffff',
        borderColor: color,
        type: 'return',
        entityId: r.id,
        entityPath: `/rentals/${r.id}`,
        metadata: {
          rentalCode: r.rental_code,
          status: r.status,
          customerName: customer,
          vehicleName: vehicle,
          licensePlate: r.vehicle?.license_plate,
          endDate: r.end_date,
        },
      };
    });
}

// ── Main Service ──────────────────────────────────────────

export const calendarService = {
  async getEvents(
    rangeStart: string,
    rangeEnd: string,
    filters: CalendarFilters,
  ): Promise<{ events: CalendarEvent[]; errors: string[] }> {
    const errors: string[] = [];
    const allEvents: CalendarEvent[] = [];

    // Extend rental range 60 days back to capture long-running rentals
    const extendedStart = format(subDays(new Date(rangeStart), 60), 'yyyy-MM-dd');

    // Share rental data between rental and return transformers
    let rentalData: Rental[] | null = null;

    const needsRentals = filters.rental || filters.return;

    const promises: Array<{ key: string; promise: Promise<CalendarEvent[]> }> = [];

    if (needsRentals) {
      promises.push({
        key: 'rentals',
        promise: rentalService
          .getAll({ start_date: extendedStart, end_date: rangeEnd, limit: 500 })
          .then((res) => {
            rentalData = res.data?.rentals || [];
            const events: CalendarEvent[] = [];
            if (filters.rental) events.push(...transformRentals(rentalData));
            if (filters.return) events.push(...transformReturns(rentalData));
            return events;
          }),
      });
    }

    if (filters.maintenance) {
      promises.push({
        key: 'maintenance',
        promise: maintenanceService
          .getMaintenanceOrders({ startDate: rangeStart, endDate: rangeEnd, limit: 500 })
          .then((res) => transformMaintenanceOrders(res.data || [])),
      });
    }

    if (filters.quote) {
      promises.push({
        key: 'quotes',
        promise: quoteService
          .getAll({ startDate: rangeStart, endDate: rangeEnd, limit: 500 })
          .then((res) => transformQuotes(res.data?.quotes || [])),
      });
    }

    if (filters.vehicleAlert) {
      promises.push({
        key: 'vehicleAlerts',
        promise: vehicleService
          .getAll({ limit: 500 })
          .then((res) => {
            const vehicles = res.data || [];
            return transformVehicleAlerts(vehicles, rangeStart, rangeEnd);
          }),
      });
    }

    const results = await Promise.allSettled(promises.map((p) => p.promise));

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      } else {
        errors.push(`Error cargando ${promises[i].key}`);
      }
    });

    return { events: allEvents, errors };
  },
};

export default calendarService;
