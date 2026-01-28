import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { env } from '../config/env';
import Rental from '../models/Rental';
import Payment from '../models/Payment';
import Return from '../models/Return';

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
    console.log('[WEBSOCKET] Servidor WebSocket inicializado');
  }

  /**
   * Configura los manejadores de eventos
   */
  private static setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[WEBSOCKET] Cliente conectado: ${socket.id}`);

      // Guardar información del cliente
      socket.on('register', (data) => {
        this.connectedClients.set(socket.id, {
          userId: data.userId,
          role: data.role,
          location: data.location
        });
        console.log(`[WEBSOCKET] Cliente registrado: ${data.userId} (${data.role})`);
      });

      // Cliente se desconecta
      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        console.log(`[WEBSOCKET] Cliente desconectado: ${socket.id}`);
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
    this.io.emit('rental:created', {
      type: 'RENTAL_CREATED',
      data: rental,
      timestamp: new Date()
    });

    console.log(`[WEBSOCKET] Notificación enviada: RENTAL_CREATED - ${rental.rental_code}`);
  }

  /**
   * Notificar actualización de renta
   */
  static notifyRentalUpdated(rental: Rental) {
    this.io.emit('rental:updated', {
      type: 'RENTAL_UPDATED',
      data: rental,
      timestamp: new Date()
    });

    console.log(`[WEBSOCKET] Notificación enviada: RENTAL_UPDATED - ${rental.rental_code}`);
  }

  /**
   * Notificar devolución procesada
   */
  static notifyReturnProcessed(returnRecord: Return) {
    this.io.emit('return:processed', {
      type: 'RETURN_PROCESSED',
      data: returnRecord,
      timestamp: new Date()
    });

    console.log(`[WEBSOCKET] Notificación enviada: RETURN_PROCESSED - ${returnRecord.return_code}`);
  }

  /**
   * Notificar pago recibido
   */
  static notifyPaymentReceived(payment: Payment) {
    this.io.emit('payment:received', {
      type: 'PAYMENT_RECEIVED',
      data: payment,
      timestamp: new Date()
    });

    console.log(`[WEBSOCKET] Notificación enviada: PAYMENT_RECEIVED - ${payment.payment_code}`);
  }

  /**
   * Notificar inventario actualizado (cuando se crea/devuelve renta)
   */
  static notifyInventoryUpdated(vehicleId: number, status: string) {
    this.io.emit('inventory:updated', {
      type: 'INVENTORY_UPDATED',
      data: {
        vehicle_id: vehicleId,
        status
      },
      timestamp: new Date()
    });

    console.log(`[WEBSOCKET] Notificación enviada: INVENTORY_UPDATED - Vehículo ${vehicleId}`);
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
    this.io.emit('alert', {
      type: 'ALERT',
      data: alert,
      timestamp: new Date()
    });

    console.log(`[WEBSOCKET] Alerta enviada: ${alert.type} - ${alert.title}`);
  }

  /**
   * Notificar a usuarios específicos por rol
   */
  static notifyByRole(role: string, event: string, data: any) {
    const clients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => client.role === role);

    clients.forEach(([socketId, _]) => {
      this.io.to(socketId).emit(event, {
        type: event.toUpperCase().replace(':', '_'),
        data,
        timestamp: new Date()
      });
    });

    console.log(`[WEBSOCKET] Notificación enviada a rol ${role}: ${clients.length} clientes`);
  }

  /**
   * Notificar a ubicación específica
   */
  static notifyByLocation(locationId: number, event: string, data: any) {
    const clients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => client.location === locationId);

    clients.forEach(([socketId, _]) => {
      this.io.to(socketId).emit(event, {
        type: event.toUpperCase().replace(':', '_'),
        data,
        timestamp: new Date()
      });
    });

    console.log(`[WEBSOCKET] Notificación enviada a ubicación ${locationId}: ${clients.length} clientes`);
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
