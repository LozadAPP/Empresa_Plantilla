import cron from 'node-cron';
import alertService from '../services/alertService';
import logger from '../config/logger';

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
 * - Limpieza de alertas: Diariamente a las 3:00 AM (elimina expiradas y resueltas +30 días)
 */
class AlertScheduler {
  private tasks: ReturnType<typeof cron.schedule>[] = [];

  /**
   * Inicia todos los cron jobs
   */
  start(): void {
    logger.info('Iniciando programador de alertas...');

    // 1. Verificación completa diaria a las 6:00 AM
    const fullCheckTask = cron.schedule('0 6 * * *', async () => {
      logger.info('Ejecutando verificación completa...');
      try {
        await alertService.runAllChecks();
      } catch (error) {
        logger.error('Error en verificación completa', { error });
      }
    });
    this.tasks.push(fullCheckTask);
    logger.info('Verificación completa programada (6:00 AM)');

    // 2. Mantenimiento - Diariamente a las 7:00 AM
    const maintenanceTask = cron.schedule('0 7 * * *', async () => {
      logger.info('Verificando mantenimiento de vehículos...');
      try {
        const count = await alertService.checkMaintenanceDue();
        logger.info(`${count} alerta(s) de mantenimiento creada(s)`);
      } catch (error) {
        logger.error('Error verificando mantenimiento', { error });
      }
    });
    this.tasks.push(maintenanceTask);
    logger.info('Verificación de mantenimiento programada (7:00 AM)');

    // 3. Seguros - Diariamente a las 7:30 AM
    const insuranceTask = cron.schedule('30 7 * * *', async () => {
      logger.info('Verificando seguros por vencer...');
      try {
        const count = await alertService.checkExpiringInsurance();
        logger.info(`${count} alerta(s) de seguro creada(s)`);
      } catch (error) {
        logger.error('Error verificando seguros', { error });
      }
    });
    this.tasks.push(insuranceTask);
    logger.info('Verificación de seguros programada (7:30 AM)');

    // 4. Rentas por vencer - Diariamente a las 8:00 AM
    const expiringRentalsTask = cron.schedule('0 8 * * *', async () => {
      logger.info('Verificando rentas por vencer...');
      try {
        const count = await alertService.checkExpiringRentals();
        logger.info(`${count} alerta(s) de rentas por vencer creada(s)`);
      } catch (error) {
        logger.error('Error verificando rentas por vencer', { error });
      }
    });
    this.tasks.push(expiringRentalsTask);
    logger.info('Verificación de rentas por vencer programada (8:00 AM)');

    // 5. Rentas vencidas - Diariamente a las 9:00 AM
    const overdueRentalsTask = cron.schedule('0 9 * * *', async () => {
      logger.info('Verificando rentas vencidas...');
      try {
        const count = await alertService.checkOverdueRentals();
        logger.info(`${count} alerta(s) de rentas vencidas creada(s)`);
      } catch (error) {
        logger.error('Error verificando rentas vencidas', { error });
      }
    });
    this.tasks.push(overdueRentalsTask);
    logger.info('Verificación de rentas vencidas programada (9:00 AM)');

    // 6. Pagos pendientes - Cada 6 horas
    const pendingPaymentsTask = cron.schedule('0 */6 * * *', async () => {
      logger.info('Verificando pagos pendientes...');
      try {
        const count = await alertService.checkPendingPayments();
        logger.info(`${count} alerta(s) de pagos pendientes creada(s)`);
      } catch (error) {
        logger.error('Error verificando pagos pendientes', { error });
      }
    });
    this.tasks.push(pendingPaymentsTask);
    logger.info('Verificación de pagos pendientes programada (cada 6 horas)');

    // 7. Inventario bajo - Cada 12 horas
    const lowInventoryTask = cron.schedule('0 */12 * * *', async () => {
      logger.info('Verificando inventario bajo...');
      try {
        const count = await alertService.checkLowInventory();
        logger.info(`${count} alerta(s) de inventario bajo creada(s)`);
      } catch (error) {
        logger.error('Error verificando inventario bajo', { error });
      }
    });
    this.tasks.push(lowInventoryTask);
    logger.info('Verificación de inventario bajo programada (cada 12 horas)');

    // 8. Cotizaciones por vencer - Diariamente a las 10:00 AM
    const expiringQuotesTask = cron.schedule('0 10 * * *', async () => {
      logger.info('Verificando cotizaciones por vencer...');
      try {
        const count = await alertService.checkExpiringQuotes();
        logger.info(`${count} alerta(s) de cotizaciones creada(s)`);
      } catch (error) {
        logger.error('Error verificando cotizaciones', { error });
      }
    });
    this.tasks.push(expiringQuotesTask);
    logger.info('Verificación de cotizaciones programada (10:00 AM)');

    // 9. Prospectos con seguimiento vencido - Diariamente a las 8:30 AM
    const staleLeadsTask = cron.schedule('30 8 * * *', async () => {
      logger.info('Verificando prospectos con seguimiento vencido...');
      try {
        const count = await alertService.checkStaleLeads();
        logger.info(`${count} alerta(s) de prospectos vencidos creada(s)`);
      } catch (error) {
        logger.error('Error verificando prospectos vencidos', { error });
      }
    });
    this.tasks.push(staleLeadsTask);
    logger.info('Verificación de prospectos programada (8:30 AM)');

    // 10. Limpieza de alertas antiguas - Diariamente a las 3:00 AM
    const cleanupTask = cron.schedule('0 3 * * *', async () => {
      logger.info('Ejecutando limpieza de alertas antiguas...');
      try {
        const result = await alertService.cleanupOldAlerts();
        logger.info(`Limpieza completada: ${result.total} alerta(s) eliminada(s) (${result.expiredDeleted} expiradas, ${result.oldResolvedDeleted} resueltas antiguas)`);
      } catch (error) {
        logger.error('Error en limpieza de alertas', { error });
      }
    });
    this.tasks.push(cleanupTask);
    logger.info('Limpieza de alertas programada (3:00 AM)');

    logger.info(`${this.tasks.length} tareas programadas activas`);
    logger.info('Programador de alertas iniciado correctamente');
  }

  /**
   * Detiene todos los cron jobs
   */
  stop(): void {
    logger.info('Deteniendo programador de alertas...');
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
    logger.info('Programador de alertas detenido');
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
    logger.info('Ejecutando verificación manual...');
    try {
      const results = await alertService.runAllChecks();
      logger.info('Verificación manual completada', { results });
    } catch (error) {
      logger.error('Error en verificación manual', { error });
      throw error;
    }
  }
}

export default new AlertScheduler();
