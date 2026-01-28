import { Transaction } from 'sequelize';
import Vehicle from '../models/Vehicle';
import Customer from '../models/Customer';
import Rental from '../models/Rental';
import Income from '../models/Income';
import { VehicleStatus } from '../models/Vehicle';
import { RentalStatus } from '../models/Rental';
import { IncomeCategory } from '../models/Income';
import { CodeGenerator } from './codeGenerator';
import { EmailService } from './emailService';
import { PDFService } from './pdfService';
import { WebSocketService } from './websocketService';

/**
 * Servicio de Cascadas Automáticas
 * Orquesta todas las acciones secundarias cuando se crea/modifica una renta
 *
 * FLUJO AL CREAR RENTA:
 * 1. Actualizar estado del vehículo a "rented"
 * 2. Crear registro de ingreso
 * 3. Generar contrato PDF
 * 4. Enviar email de confirmación al cliente
 * 5. Actualizar balance del cliente
 * 6. Notificar en tiempo real (WebSocket)
 */
export class RentalCascadeService {

  /**
   * Ejecuta todas las cascadas al crear una nueva renta
   */
  static async onRentalCreated(
    rental: Rental,
    userId?: number
  ): Promise<void> {
    try {
      console.log(`[CASCADA] Iniciando cascadas para renta ${rental.rental_code}`);

      // 1. Actualizar estado del vehículo
      await this.updateVehicleStatus(rental.vehicle_id, VehicleStatus.RENTED);
      console.log(`[CASCADA] ✓ Vehículo #${rental.vehicle_id} marcado como rentado`);

      // 2. Crear registro de ingreso
      await this.createIncomeRecord(rental, userId);
      console.log(`[CASCADA] ✓ Ingreso registrado`);

      // 3. Generar contrato PDF
      const pdfUrl = await PDFService.generateContract(rental);
      console.log(`[CASCADA] ✓ Contrato PDF generado: ${pdfUrl}`);

      // 4. Obtener datos del cliente para email
      const customer = await Customer.findByPk(rental.customer_id);
      if (customer) {
        // 5. Enviar email de confirmación
        await EmailService.sendRentalConfirmation(customer, rental, pdfUrl);
        console.log(`[CASCADA] ✓ Email enviado a ${customer.email}`);

        // 6. Actualizar balance del cliente
        await this.updateCustomerBalance(customer.id, rental.total_amount);
        console.log(`[CASCADA] ✓ Balance del cliente actualizado`);
      }

      // 7. Notificar via WebSocket
      WebSocketService.notifyRentalCreated(rental);
      WebSocketService.notifyInventoryUpdated(rental.vehicle_id, VehicleStatus.RENTED);

      console.log(`[CASCADA] ✅ Todas las cascadas completadas exitosamente`);

    } catch (error) {
      console.error(`[CASCADA] ❌ Error en cascadas:`, error);
      throw new Error(`Error en cascadas automáticas: ${error}`);
    }
  }

  /**
   * Ejecuta cascadas al completar una devolución
   */
  static async onRentalReturned(
    rental: Rental,
    returnData: {
      actual_return_date: Date;
      end_mileage: number;
      fuel_level_end: string;
      total_penalty?: number;
    },
    userId?: number,
    transaction?: Transaction
  ): Promise<void> {
    try {
      console.log(`[CASCADA] Iniciando cascadas para devolución de renta ${rental.rental_code}`);

      // 1. Actualizar estado del vehículo a disponible
      await this.updateVehicleStatus(rental.vehicle_id, VehicleStatus.AVAILABLE, transaction);
      console.log(`[CASCADA] ✓ Vehículo #${rental.vehicle_id} marcado como disponible`);

      // 2. Actualizar mileage del vehículo
      if (returnData.end_mileage) {
        await Vehicle.update(
          { mileage: returnData.end_mileage },
          { where: { id: rental.vehicle_id }, transaction }
        );
        console.log(`[CASCADA] ✓ Kilometraje actualizado a ${returnData.end_mileage}`);
      }

      // 3. Actualizar estado de la renta
      await Rental.update(
        {
          status: RentalStatus.COMPLETED,
          actual_return_date: returnData.actual_return_date,
          end_mileage: returnData.end_mileage,
          fuel_level_end: returnData.fuel_level_end
        },
        { where: { id: rental.id }, transaction }
      );
      console.log(`[CASCADA] ✓ Renta marcada como completada`);

      // 4. Si hay penalidades, crear ingreso adicional
      if (returnData.total_penalty && returnData.total_penalty > 0) {
        await this.createPenaltyIncome(rental, returnData.total_penalty, userId, transaction);
        console.log(`[CASCADA] ✓ Penalidad de $${returnData.total_penalty} registrada`);
      }

      // 5. Obtener cliente para notificación (después del commit de la transacción)
      const customer = await Customer.findByPk(rental.customer_id, { transaction });
      if (customer) {
        // 6. Enviar email de devolución completada (operación no-transaccional, se ejecuta después)
        // Nota: Los emails se envían de forma asíncrona y no deben bloquear la transacción
        setImmediate(async () => {
          try {
            await EmailService.sendReturnConfirmation(customer, rental);
            console.log(`[CASCADA] ✓ Email de devolución enviado a ${customer.email}`);
          } catch (emailError) {
            console.error(`[CASCADA] ⚠ Error enviando email:`, emailError);
          }
        });
      }

      // 7. Notificar via WebSocket (operación no-transaccional)
      setImmediate(() => {
        WebSocketService.notifyInventoryUpdated(rental.vehicle_id, VehicleStatus.AVAILABLE);
      });

      console.log(`[CASCADA] ✅ Todas las cascadas de devolución completadas`);

    } catch (error) {
      console.error(`[CASCADA] ❌ Error en cascadas de devolución:`, error);
      throw new Error(`Error en cascadas de devolución: ${error}`);
    }
  }

  /**
   * Actualiza el estado de un vehículo
   */
  private static async updateVehicleStatus(
    vehicleId: number,
    status: VehicleStatus,
    transaction?: Transaction
  ): Promise<void> {
    await Vehicle.update(
      { status, updated_at: new Date() },
      { where: { id: vehicleId }, transaction }
    );
  }

  /**
   * Crea un registro de ingreso cuando se crea una renta
   */
  private static async createIncomeRecord(
    rental: Rental,
    userId?: number
  ): Promise<Income> {
    const incomeCode = await CodeGenerator.generateIncomeCode();

    const income = await Income.create({
      income_code: incomeCode,
      rental_id: rental.id,
      category: IncomeCategory.RENTAL,
      amount: rental.total_amount,
      description: `Ingreso por renta ${rental.rental_code}`,
      transaction_date: new Date(),
      location_id: rental.location_id,
      recorded_by: userId,
      notes: `Auto-generado al crear la renta`
    });

    return income;
  }

  /**
   * Crea un registro de ingreso por penalidades
   */
  private static async createPenaltyIncome(
    rental: Rental,
    penaltyAmount: number,
    userId?: number,
    transaction?: Transaction
  ): Promise<Income> {
    const incomeCode = await CodeGenerator.generateIncomeCode();

    const income = await Income.create({
      income_code: incomeCode,
      rental_id: rental.id,
      category: IncomeCategory.PENALTY,
      amount: penaltyAmount,
      description: `Penalidad por devolución de renta ${rental.rental_code}`,
      transaction_date: new Date(),
      location_id: rental.location_id,
      recorded_by: userId,
      notes: `Auto-generado al procesar devolución`
    }, { transaction });

    return income;
  }

  /**
   * Actualiza el balance actual del cliente
   */
  private static async updateCustomerBalance(
    customerId: number,
    amount: number
  ): Promise<void> {
    const customer = await Customer.findByPk(customerId);
    if (customer) {
      const newBalance = (customer.current_balance || 0) + amount;
      await Customer.update(
        { current_balance: newBalance },
        { where: { id: customerId } }
      );
    }
  }
}
