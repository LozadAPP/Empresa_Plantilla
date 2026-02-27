import { Op, fn, col } from 'sequelize';
import Alert from '../models/Alert';
import Rental from '../models/Rental';
import Payment from '../models/Payment';
import Vehicle from '../models/Vehicle';
import VehicleType from '../models/VehicleType';
import Customer from '../models/Customer';
import Quote, { QuoteStatus } from '../models/Quote';
import Lead, { LeadStatus } from '../models/Lead';
import logger from '../config/logger';

/**
 * AlertService - Servicio para generación automática de alertas
 *
 * Genera alertas automáticamente basado en reglas de negocio:
 * - Rentas por vencer (7 días antes)
 * - Rentas vencidas (pasadas de fecha)
 * - Pagos pendientes (3+ días sin pagar)
 * - Mantenimiento requerido (fecha vencida o próxima)
 * - Seguros por vencer (30 días antes)
 * - Inventario bajo (menos de 2 vehículos disponibles por tipo)
 */
class AlertService {
  /**
   * Verifica si ya existe una alerta para una entidad específica
   * Evita duplicados en las últimas 24 horas (incluso si fue resuelta)
   */
  private async alertExists(
    alertType: string,
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for unresolved alerts (any time)
    const unresolvedCount = await Alert.count({
      where: {
        alertType,
        entityType,
        entityId,
        isResolved: false,
      },
    });

    if (unresolvedCount > 0) return true;

    // Also check for recently created alerts (last 24h) to avoid spam
    const recentCount = await Alert.count({
      where: {
        alertType,
        entityType,
        entityId,
        createdAt: { [Op.gte]: twentyFourHoursAgo },
      },
    });

    return recentCount > 0;
  }

  /**
   * Batch version: loads all existing alert entity IDs in one query
   * Replaces per-entity alertExists() calls to fix N+1
   */
  private async getExistingAlertEntityIds(
    alertType: string,
    entityType: string,
    entityIds: string[]
  ): Promise<Set<string>> {
    if (entityIds.length === 0) return new Set();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Alert.findAll({
      where: {
        alertType,
        entityType,
        entityId: { [Op.in]: entityIds },
        [Op.or]: [
          { isResolved: false },
          { createdAt: { [Op.gte]: twentyFourHoursAgo } }
        ]
      },
      attributes: ['entityId'],
      raw: true
    });
    return new Set(existing.map((a: any) => a.entityId));
  }

  /**
   * Crea una nueva alerta
   */
  private async createAlert(data: {
    alertType: 'rental_expiring' | 'rental_overdue' | 'payment_pending' | 'maintenance_due' | 'insurance_expiring' | 'low_inventory' | 'system' | 'custom';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
  }): Promise<Alert> {
    return await Alert.create({
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      isRead: false,
      isResolved: false,
    });
  }

  /**
   * 1. Verifica rentas que están por vencer (7 días antes de end_date)
   */
  async checkExpiringRentals(): Promise<number> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    const expiringRentals = await Rental.findAll({
      where: {
        end_date: {
          [Op.gte]: sevenDaysFromNow,
          [Op.lt]: eightDaysFromNow,
        },
        status: {
          [Op.in]: ['active', 'reserved'],
        },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'contact_person', 'email', 'phone'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate'],
        },
      ],
    });

    let created = 0;
    const existingIds = await this.getExistingAlertEntityIds(
      'rental_expiring', 'rental', expiringRentals.map(r => r.id.toString())
    );

    for (const rental of expiringRentals) {
      if (existingIds.has(rental.id.toString())) continue;

      const customer = rental.get('customer') as any;
      const vehicle = rental.get('vehicle') as any;

      await this.createAlert({
        alertType: 'rental_expiring',
        severity: 'warning',
        title: 'Renta Próxima a Vencer',
        message: `La renta ${rental.rental_code} vence en 7 días (${rental.end_date.toLocaleDateString()}). Cliente: ${customer?.name || customer?.contact_person}. Vehículo: ${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate}).`,
        entityType: 'rental',
        entityId: rental.id.toString(),
        metadata: {
          rentalCode: rental.rental_code,
          endDate: rental.end_date,
          customerId: rental.customer_id,
          vehicleId: rental.vehicle_id,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * 2. Verifica rentas vencidas (end_date pasada y aún activa)
   */
  async checkOverdueRentals(): Promise<number> {
    const now = new Date();

    const overdueRentals = await Rental.findAll({
      where: {
        end_date: {
          [Op.lt]: now,
        },
        status: {
          [Op.in]: ['active', 'reserved'],
        },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'contact_person', 'email', 'phone'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'license_plate'],
        },
      ],
    });

    let created = 0;
    const existingIds = await this.getExistingAlertEntityIds(
      'rental_overdue', 'rental', overdueRentals.map(r => r.id.toString())
    );

    for (const rental of overdueRentals) {
      if (existingIds.has(rental.id.toString())) continue;

      const customer = rental.get('customer') as any;
      const vehicle = rental.get('vehicle') as any;

      const daysOverdue = Math.floor(
        (now.getTime() - rental.end_date.getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.createAlert({
        alertType: 'rental_overdue',
        severity: 'critical',
        title: 'Renta Vencida',
        message: `La renta ${rental.rental_code} está vencida por ${daysOverdue} día(s). Fecha de fin: ${rental.end_date.toLocaleDateString()}. Cliente: ${customer?.name || customer?.contact_person}. Vehículo: ${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate}).`,
        entityType: 'rental',
        entityId: rental.id.toString(),
        metadata: {
          rentalCode: rental.rental_code,
          endDate: rental.end_date,
          daysOverdue,
          customerId: rental.customer_id,
          vehicleId: rental.vehicle_id,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * 3. Verifica pagos pendientes (3+ días sin completar)
   */
  async checkPendingPayments(): Promise<number> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingPayments = await Payment.findAll({
      where: {
        status: 'pending',
        transaction_date: {
          [Op.lte]: threeDaysAgo,
        },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'contact_person', 'email', 'phone'],
        },
      ],
    });

    let created = 0;
    const existingIds = await this.getExistingAlertEntityIds(
      'payment_pending', 'payment', pendingPayments.map(p => p.id.toString())
    );

    for (const payment of pendingPayments) {
      if (existingIds.has(payment.id.toString())) continue;

      const customer = payment.get('customer') as any;

      const daysPending = Math.floor(
        (new Date().getTime() - payment.transaction_date.getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.createAlert({
        alertType: 'payment_pending',
        severity: 'warning',
        title: 'Pago Pendiente',
        message: `El pago ${payment.payment_code} está pendiente por ${daysPending} días. Monto: $${payment.amount}. Cliente: ${customer?.name || customer?.contact_person}.`,
        entityType: 'payment',
        entityId: payment.id.toString(),
        metadata: {
          paymentCode: payment.payment_code,
          amount: payment.amount,
          daysPending,
          customerId: payment.customer_id,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * 4. Verifica vehículos que requieren mantenimiento
   * (next_maintenance en el pasado o dentro de 30 días)
   */
  async checkMaintenanceDue(): Promise<number> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const vehiclesNeedingMaintenance = await Vehicle.findAll({
      where: {
        next_maintenance: {
          [Op.lte]: thirtyDaysFromNow,
        },
        is_active: true,
      },
    });

    let created = 0;
    const existingIds = await this.getExistingAlertEntityIds(
      'maintenance_due', 'vehicle', vehiclesNeedingMaintenance.map(v => v.id.toString())
    );

    for (const vehicle of vehiclesNeedingMaintenance) {
      if (existingIds.has(vehicle.id.toString())) continue;

      const now = new Date();
      const isPastDue = vehicle.next_maintenance! < now;

      const daysUntil = Math.floor(
        (vehicle.next_maintenance!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.createAlert({
        alertType: 'maintenance_due',
        severity: isPastDue ? 'critical' : 'warning',
        title: isPastDue ? 'Mantenimiento Vencido' : 'Mantenimiento Próximo',
        message: isPastDue
          ? `El vehículo ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) tiene mantenimiento vencido desde ${vehicle.next_maintenance!.toLocaleDateString()}. Kilometraje: ${vehicle.mileage} km.`
          : `El vehículo ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) requiere mantenimiento en ${daysUntil} días (${vehicle.next_maintenance!.toLocaleDateString()}). Kilometraje: ${vehicle.mileage} km.`,
        entityType: 'vehicle',
        entityId: vehicle.id.toString(),
        metadata: {
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          licensePlate: vehicle.license_plate,
          nextMaintenance: vehicle.next_maintenance,
          mileage: vehicle.mileage,
          isPastDue,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * 5. Verifica seguros de vehículos que están por vencer (30 días)
   */
  async checkExpiringInsurance(): Promise<number> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const thirtyOneDaysFromNow = new Date();
    thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);

    const vehiclesWithExpiringInsurance = await Vehicle.findAll({
      where: {
        insurance_expiry: {
          [Op.gte]: new Date(),
          [Op.lte]: thirtyDaysFromNow,
        },
        is_active: true,
      },
    });

    let created = 0;
    const existingIds = await this.getExistingAlertEntityIds(
      'insurance_expiring', 'vehicle', vehiclesWithExpiringInsurance.map(v => v.id.toString())
    );

    for (const vehicle of vehiclesWithExpiringInsurance) {
      if (existingIds.has(vehicle.id.toString())) continue;

      const daysUntilExpiry = Math.floor(
        (vehicle.insurance_expiry!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.createAlert({
        alertType: 'insurance_expiring',
        severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
        title: 'Seguro Por Vencer',
        message: `El seguro del vehículo ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) vence en ${daysUntilExpiry} días (${vehicle.insurance_expiry!.toLocaleDateString()}).`,
        entityType: 'vehicle',
        entityId: vehicle.id.toString(),
        metadata: {
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          licensePlate: vehicle.license_plate,
          insuranceExpiry: vehicle.insurance_expiry,
          daysUntilExpiry,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * 6. Verifica inventario bajo (menos de 2 vehículos disponibles por tipo)
   */
  async checkLowInventory(): Promise<number> {
    const threshold = 2; // Umbral mínimo de vehículos disponibles

    const vehicleTypes = await VehicleType.findAll({
      attributes: ['id', 'name'],
    });

    let created = 0;

    // Batch: get available counts per type in one query
    const availableCounts = await Vehicle.findAll({
      where: { status: 'available', is_active: true },
      attributes: ['vehicle_type_id', [fn('COUNT', col('id')), 'count']],
      group: ['vehicle_type_id'],
      raw: true
    });

    const countMap = new Map<number, number>();
    (availableCounts as any[]).forEach((row: any) => {
      countMap.set(row.vehicle_type_id, Number.parseInt(row.count));
    });

    // Find types below threshold
    const lowTypes = vehicleTypes.filter(vt => (countMap.get(vt.id) || 0) < threshold);

    const existingIds = await this.getExistingAlertEntityIds(
      'low_inventory', 'vehicle_type', lowTypes.map(vt => vt.id.toString())
    );

    for (const vehicleType of lowTypes) {
      if (existingIds.has(vehicleType.id.toString())) continue;

      const availableCount = countMap.get(vehicleType.id) || 0;

      await this.createAlert({
        alertType: 'low_inventory',
        severity: availableCount === 0 ? 'critical' : 'warning',
        title: 'Inventario Bajo',
        message: `Solo quedan ${availableCount} vehículo(s) disponible(s) del tipo "${vehicleType.name}". Considere revisar la disponibilidad.`,
        entityType: 'vehicle_type',
        entityId: vehicleType.id.toString(),
        metadata: {
          vehicleTypeName: vehicleType.name,
          availableCount,
          threshold,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * 7. Verifica cotizaciones por vencer y auto-expira las vencidas
   */
  async checkExpiringQuotes(): Promise<number> {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    // Buscar cotizaciones activas (draft o sent) que vencen pronto o ya vencieron
    const quotes = await Quote.findAll({
      where: {
        valid_until: {
          [Op.lte]: twoDaysFromNow,
        },
        status: {
          [Op.in]: [QuoteStatus.DRAFT, QuoteStatus.SENT],
        },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    let created = 0;

    // Auto-expirar cotizaciones vencidas (must happen before batch check)
    for (const quote of quotes) {
      const validUntil = new Date(quote.valid_until);
      if (validUntil < now) {
        await quote.update({ status: QuoteStatus.EXPIRED, updated_at: new Date() });
      }
    }

    // Batch check for existing alerts
    const existingIds = await this.getExistingAlertEntityIds(
      'quote_expiring', 'quote', quotes.map(q => q.id.toString())
    );

    for (const quote of quotes) {
      if (existingIds.has(quote.id.toString())) continue;

      const validUntil = new Date(quote.valid_until);
      const customer = quote.get('customer') as any;
      const isExpired = validUntil < now;

      await this.createAlert({
        alertType: 'custom',
        severity: isExpired ? 'critical' : 'warning',
        title: isExpired ? 'Cotización Expirada' : 'Cotización Por Vencer',
        message: isExpired
          ? `La cotización ${quote.quote_code} ha expirado (${validUntil.toLocaleDateString()}). Cliente: ${customer?.name || 'N/A'}. Total: $${quote.total_amount}.`
          : `La cotización ${quote.quote_code} vence el ${validUntil.toLocaleDateString()}. Cliente: ${customer?.name || 'N/A'}. Total: $${quote.total_amount}.`,
        entityType: 'quote',
        entityId: quote.id.toString(),
        metadata: {
          quoteCode: quote.quote_code,
          validUntil: quote.valid_until,
          customerId: quote.customer_id,
          totalAmount: quote.total_amount,
          isExpired,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * 8. Verifica prospectos (leads) con seguimiento vencido
   */
  async checkStaleLeads(): Promise<number> {
    const now = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const staleLeads = await Lead.findAll({
      where: {
        nextFollowUp: { [Op.lt]: now },
        status: {
          [Op.notIn]: [LeadStatus.WON, LeadStatus.LOST],
        },
      },
    });

    let created = 0;
    const existingIds = await this.getExistingAlertEntityIds(
      'custom', 'lead', staleLeads.map(l => l.id.toString())
    );

    for (const lead of staleLeads) {
      if (existingIds.has(lead.id.toString())) continue;

      const followUpDate = new Date(lead.nextFollowUp!);
      const daysOverdue = Math.floor(
        (now.getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const severity = followUpDate < threeDaysAgo ? 'critical' : 'warning';

      await this.createAlert({
        alertType: 'custom',
        severity: severity as 'warning' | 'critical',
        title: 'Seguimiento de Prospecto Vencido',
        message: `El prospecto ${lead.leadCode} (${lead.name}) tiene un seguimiento vencido desde hace ${daysOverdue} día(s). Fecha programada: ${followUpDate.toLocaleDateString()}.`,
        entityType: 'lead',
        entityId: lead.id.toString(),
        metadata: {
          leadCode: lead.leadCode,
          leadName: lead.name,
          status: lead.status,
          nextFollowUp: lead.nextFollowUp,
          daysOverdue,
        },
      });
      created++;
    }

    return created;
  }

  /**
   * Ejecuta todas las verificaciones de alertas
   */
  async runAllChecks(): Promise<{
    expiringRentals: number;
    overdueRentals: number;
    pendingPayments: number;
    maintenanceDue: number;
    expiringInsurance: number;
    lowInventory: number;
    expiringQuotes: number;
    staleLeads: number;
    total: number;
  }> {
    logger.info('[AlertService] Iniciando verificación de alertas...');

    const [
      expiringRentals,
      overdueRentals,
      pendingPayments,
      maintenanceDue,
      expiringInsurance,
      lowInventory,
      expiringQuotes,
      staleLeads,
    ] = await Promise.all([
      this.checkExpiringRentals(),
      this.checkOverdueRentals(),
      this.checkPendingPayments(),
      this.checkMaintenanceDue(),
      this.checkExpiringInsurance(),
      this.checkLowInventory(),
      this.checkExpiringQuotes(),
      this.checkStaleLeads(),
    ]);

    const total =
      expiringRentals +
      overdueRentals +
      pendingPayments +
      maintenanceDue +
      expiringInsurance +
      lowInventory +
      expiringQuotes +
      staleLeads;

    logger.info('[AlertService] Verificación completa', {
      expiringRentals,
      overdueRentals,
      pendingPayments,
      maintenanceDue,
      expiringInsurance,
      lowInventory,
      expiringQuotes,
      staleLeads,
      total,
    });

    return {
      expiringRentals,
      overdueRentals,
      pendingPayments,
      maintenanceDue,
      expiringInsurance,
      lowInventory,
      expiringQuotes,
      staleLeads,
      total,
    };
  }

  /**
   * Limpia alertas expiradas y resueltas antiguas
   * - Elimina alertas con expiresAt pasada
   * - Elimina alertas resueltas con más de 30 días
   */
  async cleanupOldAlerts(): Promise<{
    expiredDeleted: number;
    oldResolvedDeleted: number;
    total: number;
  }> {
    logger.info('[AlertService] Iniciando limpieza de alertas antiguas...');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Delete expired alerts (where expiresAt is not null AND expiresAt < now)
    const expiredDeleted = await Alert.destroy({
      where: {
        expiresAt: {
          [Op.lt]: now,
          [Op.ne]: null as unknown as Date, // Type assertion for Sequelize strict types
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    // Delete old resolved alerts (older than 30 days)
    const oldResolvedDeleted = await Alert.destroy({
      where: {
        isResolved: true,
        resolvedAt: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });

    const total = expiredDeleted + oldResolvedDeleted;

    logger.info('[AlertService] Limpieza completada', {
      expiredDeleted,
      oldResolvedDeleted,
      total,
    });

    return {
      expiredDeleted,
      oldResolvedDeleted,
      total,
    };
  }
}

export default new AlertService();
