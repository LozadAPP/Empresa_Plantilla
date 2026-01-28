import cron from 'node-cron';
import alertService from '../services/alertService';

/**
 * AlertScheduler - Programador de tareas automáticas para generación de alertas
 *
 * Horarios programados:
 * - Rentas por vencer: Diariamente a las 8:00 AM
 * - Rentas vencidas: Diariamente a las 9:00 AM
 * - Pagos pendientes: Cada 6 horas
 * - Mantenimiento: Diariamente a las 7:00 AM
 * - Seguros: Diariamente a las 7:30 AM
 * - Inventario bajo: Cada 12 horas
 * - Verificación completa: Diariamente a las 6:00 AM
 */
class AlertScheduler {
  private tasks: ReturnType<typeof cron.schedule>[] = [];

  /**
   * Inicia todos los cron jobs
   */
  start(): void {
    console.log('[AlertScheduler] Iniciando programador de alertas...');

    // 1. Verificación completa diaria a las 6:00 AM
    const fullCheckTask = cron.schedule('0 6 * * *', async () => {
      console.log('[AlertScheduler] Ejecutando verificación completa...');
      try {
        await alertService.runAllChecks();
      } catch (error) {
        console.error('[AlertScheduler] Error en verificación completa:', error);
      }
    });
    this.tasks.push(fullCheckTask);
    console.log('[AlertScheduler] ✓ Verificación completa programada (6:00 AM)');

    // 2. Mantenimiento - Diariamente a las 7:00 AM
    const maintenanceTask = cron.schedule('0 7 * * *', async () => {
      console.log('[AlertScheduler] Verificando mantenimiento de vehículos...');
      try {
        const count = await alertService.checkMaintenanceDue();
        console.log(`[AlertScheduler] ${count} alerta(s) de mantenimiento creada(s)`);
      } catch (error) {
        console.error('[AlertScheduler] Error verificando mantenimiento:', error);
      }
    });
    this.tasks.push(maintenanceTask);
    console.log('[AlertScheduler] ✓ Verificación de mantenimiento programada (7:00 AM)');

    // 3. Seguros - Diariamente a las 7:30 AM
    const insuranceTask = cron.schedule('30 7 * * *', async () => {
      console.log('[AlertScheduler] Verificando seguros por vencer...');
      try {
        const count = await alertService.checkExpiringInsurance();
        console.log(`[AlertScheduler] ${count} alerta(s) de seguro creada(s)`);
      } catch (error) {
        console.error('[AlertScheduler] Error verificando seguros:', error);
      }
    });
    this.tasks.push(insuranceTask);
    console.log('[AlertScheduler] ✓ Verificación de seguros programada (7:30 AM)');

    // 4. Rentas por vencer - Diariamente a las 8:00 AM
    const expiringRentalsTask = cron.schedule('0 8 * * *', async () => {
      console.log('[AlertScheduler] Verificando rentas por vencer...');
      try {
        const count = await alertService.checkExpiringRentals();
        console.log(`[AlertScheduler] ${count} alerta(s) de rentas por vencer creada(s)`);
      } catch (error) {
        console.error('[AlertScheduler] Error verificando rentas por vencer:', error);
      }
    });
    this.tasks.push(expiringRentalsTask);
    console.log('[AlertScheduler] ✓ Verificación de rentas por vencer programada (8:00 AM)');

    // 5. Rentas vencidas - Diariamente a las 9:00 AM
    const overdueRentalsTask = cron.schedule('0 9 * * *', async () => {
      console.log('[AlertScheduler] Verificando rentas vencidas...');
      try {
        const count = await alertService.checkOverdueRentals();
        console.log(`[AlertScheduler] ${count} alerta(s) de rentas vencidas creada(s)`);
      } catch (error) {
        console.error('[AlertScheduler] Error verificando rentas vencidas:', error);
      }
    });
    this.tasks.push(overdueRentalsTask);
    console.log('[AlertScheduler] ✓ Verificación de rentas vencidas programada (9:00 AM)');

    // 6. Pagos pendientes - Cada 6 horas
    const pendingPaymentsTask = cron.schedule('0 */6 * * *', async () => {
      console.log('[AlertScheduler] Verificando pagos pendientes...');
      try {
        const count = await alertService.checkPendingPayments();
        console.log(`[AlertScheduler] ${count} alerta(s) de pagos pendientes creada(s)`);
      } catch (error) {
        console.error('[AlertScheduler] Error verificando pagos pendientes:', error);
      }
    });
    this.tasks.push(pendingPaymentsTask);
    console.log('[AlertScheduler] ✓ Verificación de pagos pendientes programada (cada 6 horas)');

    // 7. Inventario bajo - Cada 12 horas
    const lowInventoryTask = cron.schedule('0 */12 * * *', async () => {
      console.log('[AlertScheduler] Verificando inventario bajo...');
      try {
        const count = await alertService.checkLowInventory();
        console.log(`[AlertScheduler] ${count} alerta(s) de inventario bajo creada(s)`);
      } catch (error) {
        console.error('[AlertScheduler] Error verificando inventario bajo:', error);
      }
    });
    this.tasks.push(lowInventoryTask);
    console.log('[AlertScheduler] ✓ Verificación de inventario bajo programada (cada 12 horas)');

    console.log(`[AlertScheduler] ${this.tasks.length} tareas programadas activas`);
    console.log('[AlertScheduler] Programador de alertas iniciado correctamente');
  }

  /**
   * Detiene todos los cron jobs
   */
  stop(): void {
    console.log('[AlertScheduler] Deteniendo programador de alertas...');
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
    console.log('[AlertScheduler] Programador de alertas detenido');
  }

  /**
   * Obtiene el estado del programador
   */
  getStatus(): {
    isRunning: boolean;
    taskCount: number;
  } {
    return {
      isRunning: this.tasks.length > 0,
      taskCount: this.tasks.length,
    };
  }

  /**
   * Ejecuta todas las verificaciones manualmente (para testing)
   */
  async runManualCheck(): Promise<void> {
    console.log('[AlertScheduler] Ejecutando verificación manual...');
    try {
      const results = await alertService.runAllChecks();
      console.log('[AlertScheduler] Verificación manual completada:', results);
    } catch (error) {
      console.error('[AlertScheduler] Error en verificación manual:', error);
      throw error;
    }
  }
}

export default new AlertScheduler();
