/**
 * WebSocket Hook para Actualizaciones en Tiempo Real (CHAT 2)
 */
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { AppDispatch } from '../store';
import { fetchRentals } from '../store/slices/rentalSlice';
import { fetchReturns } from '../store/slices/returnSlice';
import { fetchPayments } from '../store/slices/paymentSlice';

// WebSocket events: rental:created/updated/cancelled, return:created, payment:created, invoice:created, notification

export const useWebSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Solo crear conexión si no existe
    if (socketRef.current) return;

    // Obtener URL del backend desde variables de entorno
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace('/api', '');

    // Crear conexión WebSocket
    const socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', () => {
      // WebSocket connected
    });

    socket.on('disconnect', () => {
      // WebSocket disconnected
    });

    socket.on('connect_error', () => {
      // WebSocket connection error
    });

    // Eventos de rentas
    socket.on('rental:created', (data) => {
      // Refrescar lista de rentas
      dispatch(fetchRentals({}));

      // Mostrar notificación (opcional)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nueva Renta', {
          body: `Renta ${data.rental_code} creada exitosamente`,
          icon: '/logo.png'
        });
      }
    });

    socket.on('rental:updated', () => {
      dispatch(fetchRentals({}));
    });

    socket.on('rental:cancelled', () => {
      dispatch(fetchRentals({}));
    });

    // Eventos de devoluciones
    socket.on('return:created', () => {
      dispatch(fetchReturns({}));
      dispatch(fetchRentals({})); // También actualizar rentas

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Devolución Registrada', {
          body: `Vehículo devuelto exitosamente`,
          icon: '/logo.png'
        });
      }
    });

    // Eventos de pagos
    socket.on('payment:created', (data) => {
      dispatch(fetchPayments({}));

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pago Registrado', {
          body: `Pago de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.amount)} registrado`,
          icon: '/logo.png'
        });
      }
    });

    // Eventos de facturas
    socket.on('invoice:created', () => {
      // Aquí podrías actualizar el estado de facturas si tienes un slice
    });

    // Notificaciones genéricas
    socket.on('notification', (data) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title || 'Notificación', {
          body: data.message,
          icon: '/logo.png'
        });
      }
    });

    // Cleanup: desconectar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [dispatch]);

  // Función para emitir eventos (opcional)
  const emit = (event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  };

  // Solicitar permiso de notificaciones (opcional)
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return {
    socket: socketRef.current,
    emit,
    requestNotificationPermission,
    isConnected: socketRef.current?.connected || false
  };
};
