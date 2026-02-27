import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import alertService from '../services/alertService';
import { AlertListItem } from '../types/alert';

// ── Types ──────────────────────────────────────────────────

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface NotificationContextType {
  unreadCount: number;
  recentNotifications: AlertListItem[];
  isConnected: boolean;
  lastEvent: WebSocketEvent | null;
  refreshAlerts: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  recentNotifications: [],
  isConnected: false,
  lastEvent: null,
  refreshAlerts: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// ── Provider ───────────────────────────────────────────────

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AlertListItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  // ── Load alert stats from API ────────────────────────────

  const refreshAlerts = useCallback(async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        alertService.getAlertStats(),
        alertService.getAlerts({ isResolved: false, limit: 10 }),
      ]);

      setUnreadCount(statsRes.data?.unread || 0);

      const mapped: AlertListItem[] = (alertsRes.data || []).map((a: any) => ({
        id: a.id,
        alertType: a.alertType,
        severity: a.severity,
        title: a.title,
        message: a.message,
        isRead: a.isRead,
        isResolved: a.isResolved,
        entityType: a.entityType,
        entityId: a.entityId,
        createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date(a.createdAt).toISOString(),
      }));
      setRecentNotifications(mapped);
    } catch {
      // Silently fail — badge will show stale data
    }
  }, []);

  // ── Mark single alert as read ────────────────────────────

  const markAsRead = useCallback(async (id: number) => {
    try {
      await alertService.markAsRead(id);
      setRecentNotifications(prev =>
        prev.map(a => (a.id === id ? { ...a, isRead: true } : a))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  // ── Mark all alerts as read ──────────────────────────────

  const markAllAsRead = useCallback(async () => {
    try {
      // Mark each unread alert individually (no batch endpoint)
      const unread = recentNotifications.filter(a => !a.isRead);
      await Promise.all(unread.map(a => alertService.markAsRead(a.id)));
      setRecentNotifications(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, [recentNotifications]);

  // ── WebSocket connection ─────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Build socket URL from API URL (remove /api/v1 suffix)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    const socketUrl = apiUrl.replace(/\/api(\/v\d+)?$/, '');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // ── Connection events ──────────────────────────────────

    socket.on('connect', () => {
      setIsConnected(true);

      // Register this client with user info
      socket.emit('register', {
        userId: user.id,
        role: user.roles?.[0] || 'vendedor',
        location: user.location_id || null,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    // ── Business events ────────────────────────────────────
    // All events follow the same shape: { type, data, timestamp }
    // We store the last event so consumers (toasts in 10B) can react

    const handleEvent = (eventName: string) => (payload: any) => {
      setLastEvent({
        type: eventName,
        data: payload?.data || payload,
        timestamp: payload?.timestamp || new Date().toISOString(),
      });
    };

    socket.on('rental:created', handleEvent('rental:created'));
    socket.on('rental:updated', handleEvent('rental:updated'));
    socket.on('return:processed', handleEvent('return:processed'));
    socket.on('payment:received', handleEvent('payment:received'));
    socket.on('inventory:updated', handleEvent('inventory:updated'));
    socket.on('quote:status_changed', handleEvent('quote:status_changed'));
    socket.on('expense:created', handleEvent('expense:created'));
    socket.on('expense:approved', handleEvent('expense:approved'));
    socket.on('supplier:created', handleEvent('supplier:created'));

    // Alert events also refresh the unread count
    socket.on('alert', (payload: any) => {
      handleEvent('alert')(payload);
      // Increment unread count instantly (the alert was just created)
      setUnreadCount(prev => prev + 1);
      // Add to recent notifications if we have the data
      if (payload?.data) {
        const alertData = payload.data;
        const newAlert: AlertListItem = {
          id: Date.now(), // Temporary ID — refreshAlerts will get the real one
          alertType: alertData.type || 'system',
          severity: alertData.type === 'error' ? 'critical' : alertData.type === 'warning' ? 'warning' : 'info',
          title: alertData.title || 'Nueva alerta',
          message: alertData.message || '',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setRecentNotifications(prev => [newAlert, ...prev].slice(0, 10));
      }
    });

    // ── Initial data load ──────────────────────────────────

    refreshAlerts();

    // ── Cleanup ────────────────────────────────────────────

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fallback polling (60s) ───────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const pollIfVisible = () => {
      if (!document.hidden) {
        refreshAlerts();
      }
    };

    pollingRef.current = setInterval(pollIfVisible, 60000);

    // Also refresh when tab becomes visible
    const handleVisibility = () => {
      if (!document.hidden) refreshAlerts();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, refreshAlerts]);

  // ── Context value ────────────────────────────────────────

  const value: NotificationContextType = {
    unreadCount,
    recentNotifications,
    isConnected,
    lastEvent,
    refreshAlerts,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
