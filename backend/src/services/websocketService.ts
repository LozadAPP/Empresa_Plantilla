import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { env } from '../config/env';
import Rental from '../models/Rental';
import Payment from '../models/Payment';
import Return from '../models/Return';
import Quote from '../models/Quote';
import Expense from '../models/Expense';
import logger from '../config/logger';

/**
 * Servicio de WebSockets para actualizaciones en tiempo real
 * Notifica eventos del sistema a clientes conectados
 */
export class WebSocketService {
  private static io: SocketIOServer;
  private static connectedClients: Map<string, any> = new Map();

  /**
   * Inicializa el servidor de WebSockets
   */
  static initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupEventHandlers();
    logger.info('[WEBSOCKET] Servidor WebSocket inicializado');
  }

  /**
   * Configura los manejadores de eventos
   */
  private static setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.debug(`[WEBSOCKET] Cliente conectado: ${socket.id}`);

      // Guardar información del cliente
      socket.on('register', (data) => {
        this.connectedClients.set(socket.id, {
          userId: data.userId,
          role: data.role,
          location: data.location
        });
        logger.debug(`[WEBSOCKET] Cliente registrado: ${data.userId} (${data.role})`);
      });

      // Cliente se desconecta
      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        logger.debug(`[WEBSOCKET] Cliente desconectado: ${socket.id}`);
      });

      // Ping/Pong para mantener conexión activa
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Notificar creación de renta
   */
  static notifyRentalCreated(rental: Rental) {
    if (!this.io) return;
    this.io.emit('rental:created', {
      type: 'RENTAL_CREATED',
      data: rental,
      timestamp: new Date()
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada: RENTAL_CREATED - ${rental.rental_code}`);
  }

  /**
   * Notificar actualización de renta
   */
  static notifyRentalUpdated(rental: Rental) {
    if (!this.io) return;
    this.io.emit('rental:updated', {
      type: 'RENTAL_UPDATED',
      data: rental,
      timestamp: new Date()
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada: RENTAL_UPDATED - ${rental.rental_code}`);
  }

  /**
   * Notificar devolución procesada
   */
  static notifyReturnProcessed(returnRecord: Return) {
    if (!this.io) return;
    this.io.emit('return:processed', {
      type: 'RETURN_PROCESSED',
      data: returnRecord,
      timestamp: new Date()
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada: RETURN_PROCESSED - ${returnRecord.return_code}`);
  }

  /**
   * Notificar pago recibido
   */
  static notifyPaymentReceived(payment: Payment) {
    if (!this.io) return;
    this.io.emit('payment:received', {
      type: 'PAYMENT_RECEIVED',
      data: payment,
      timestamp: new Date()
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada: PAYMENT_RECEIVED - ${payment.payment_code}`);
  }

  /**
   * Notificar inventario actualizado (cuando se crea/devuelve renta)
   */
  static notifyInventoryUpdated(vehicleId: number, status: string) {
    if (!this.io) return;
    this.io.emit('inventory:updated', {
      type: 'INVENTORY_UPDATED',
      data: {
        vehicle_id: vehicleId,
        status
      },
      timestamp: new Date()
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada: INVENTORY_UPDATED - Vehiculo ${vehicleId}`);
  }

  /**
   * Notificar alerta crítica
   */
  static notifyAlert(alert: {
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    data?: any;
  }) {
    if (!this.io) return;
    this.io.emit('alert', {
      type: 'ALERT',
      data: alert,
      timestamp: new Date()
    });

    logger.debug(`[WEBSOCKET] Alerta enviada: ${alert.type} - ${alert.title}`);
  }

  /**
   * Notificar a usuarios específicos por rol
   */
  static notifyByRole(role: string, event: string, data: any) {
    if (!this.io) return;
    const clients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => client.role === role);

    clients.forEach(([socketId, _]) => {
      this.io.to(socketId).emit(event, {
        type: event.toUpperCase().replace(':', '_'),
        data,
        timestamp: new Date()
      });
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada a rol ${role}: ${clients.length} clientes`);
  }

  /**
   * Notificar a ubicación específica
   */
  static notifyByLocation(locationId: number, event: string, data: any) {
    if (!this.io) return;
    const clients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => client.location === locationId);

    clients.forEach(([socketId, _]) => {
      this.io.to(socketId).emit(event, {
        type: event.toUpperCase().replace(':', '_'),
        data,
        timestamp: new Date()
      });
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada a ubicacion ${locationId}: ${clients.length} clientes`);
  }

  /**
   * Notificar cambio de status de cotización
   */
  static notifyQuoteStatusChanged(quote: Quote, newStatus: string) {
    if (!this.io) return;

    this.io.emit('quote:status_changed', {
      type: 'QUOTE_STATUS_CHANGED',
      data: {
        id: quote.id,
        quote_code: quote.quote_code,
        status: newStatus,
        customer_id: quote.customer_id,
        total_amount: quote.total_amount
      },
      timestamp: new Date()
    });

    logger.debug(`[WEBSOCKET] Notificacion enviada: QUOTE_STATUS_CHANGED - ${quote.quote_code} -> ${newStatus}`);
  }

  /**
   * Notificar gasto registrado
   */
  static notifyExpenseCreated(expense: Expense) {
    if (!this.io) return;
    this.io.emit('expense:created', {
      type: 'EXPENSE_CREATED',
      data: {
        id: expense.id,
        expense_code: expense.expenseCode,
        total_amount: expense.totalAmount,
        category: expense.category
      },
      timestamp: new Date()
    });
    logger.debug(`[WEBSOCKET] Notificacion enviada: EXPENSE_CREATED - ${expense.expenseCode}`);
  }

  /**
   * Notificar gasto aprobado
   */
  static notifyExpenseApproved(expense: Expense) {
    if (!this.io) return;
    this.io.emit('expense:approved', {
      type: 'EXPENSE_APPROVED',
      data: {
        id: expense.id,
        expense_code: expense.expenseCode,
        total_amount: expense.totalAmount,
        category: expense.category
      },
      timestamp: new Date()
    });
    logger.debug(`[WEBSOCKET] Notificacion enviada: EXPENSE_APPROVED - ${expense.expenseCode}`);
  }

  /**
   * Notificar proveedor creado
   */
  static notifySupplierCreated(supplier: any) {
    if (!this.io) return;
    this.io.emit('supplier:created', {
      type: 'SUPPLIER_CREATED',
      data: {
        id: supplier.id,
        supplier_code: supplier.supplierCode,
        name: supplier.name,
      },
      timestamp: new Date()
    });
    logger.debug(`[WEBSOCKET] Notificacion enviada: SUPPLIER_CREATED - ${supplier.supplierCode}`);
  }

  /**
   * Obtener número de clientes conectados
   */
  static getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Obtener información de clientes conectados
   */
  static getConnectedClients(): any[] {
    return Array.from(this.connectedClients.entries()).map(([socketId, data]) => ({
      socketId,
      ...data
    }));
  }
}
