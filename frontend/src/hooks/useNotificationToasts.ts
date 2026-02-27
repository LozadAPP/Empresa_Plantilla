import { useEffect, useRef } from 'react';
import { useSnackbar, VariantType } from 'notistack';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook that displays toast notifications when WebSocket events arrive.
 * Must be called inside a component that is a child of both
 * <NotificationProvider> and <SnackbarProvider>.
 */
export const useNotificationToasts = () => {
  const { lastEvent } = useNotifications();
  const { enqueueSnackbar } = useSnackbar();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastEvent) return;

    // Prevent duplicate toasts for the same event
    const eventKey = `${lastEvent.type}-${lastEvent.timestamp}`;
    if (processedRef.current === eventKey) return;
    processedRef.current = eventKey;

    const { type, data } = lastEvent;
    let message = '';
    let variant: VariantType = 'info';

    switch (type) {
      case 'rental:created':
        message = `Nueva renta ${data?.rental_code || ''} creada`;
        variant = 'success';
        break;

      case 'rental:updated':
        message = `Renta ${data?.rental_code || ''} actualizada`;
        variant = 'info';
        break;

      case 'return:processed':
        message = `Devolución ${data?.return_code || ''} procesada`;
        variant = 'success';
        break;

      case 'payment:received': {
        const amount = data?.amount || data?.total_amount;
        const formatted = amount
          ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
          : '';
        message = `Pago recibido${formatted ? `: ${formatted}` : ''}`;
        variant = 'success';
        break;
      }

      case 'inventory:updated':
        message = `Inventario actualizado — Vehículo #${data?.vehicle_id || ''}`;
        variant = 'info';
        break;

      case 'quote:status_changed': {
        const statusLabels: Record<string, string> = {
          sent: 'enviada',
          accepted: 'aceptada',
          rejected: 'rechazada',
          expired: 'expirada',
          converted: 'convertida a renta',
        };
        const label = statusLabels[data?.status] || data?.status || '';
        message = `Cotización ${data?.quote_code || ''} ${label}`;
        variant = data?.status === 'accepted' ? 'success'
          : data?.status === 'rejected' ? 'warning'
          : 'info';
        break;
      }

      case 'expense:created': {
        message = `Nuevo gasto ${data?.expense_code || ''} registrado`;
        variant = 'info';
        break;
      }

      case 'expense:approved': {
        const amt = data?.total_amount;
        const fmt = amt
          ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amt)
          : '';
        message = `Gasto ${data?.expense_code || ''} aprobado${fmt ? `: ${fmt}` : ''}`;
        variant = 'success';
        break;
      }

      case 'supplier:created': {
        message = `Nuevo proveedor ${data?.name || data?.supplier_code || ''} registrado`;
        variant = 'info';
        break;
      }

      case 'lead:created': {
        message = `Nuevo prospecto ${data?.lead_code || ''} creado`;
        variant = 'success';
        break;
      }

      case 'lead:status_changed': {
        const leadStatusLabels: Record<string, string> = {
          contacted: 'contactado',
          qualified: 'calificado',
          proposal: 'en propuesta',
          negotiation: 'en negociación',
          won: 'ganado',
          lost: 'perdido',
        };
        const leadLabel = leadStatusLabels[data?.status] || data?.status || '';
        message = `Prospecto ${data?.lead_code || ''} ${leadLabel}`;
        variant = data?.status === 'won' ? 'success'
          : data?.status === 'lost' ? 'warning'
          : 'info';
        break;
      }

      case 'lead:converted': {
        message = `Prospecto ${data?.lead_code || ''} convertido a cliente`;
        variant = 'success';
        break;
      }

      case 'alert': {
        message = data?.title || 'Nueva alerta del sistema';
        const alertType = data?.type;
        variant = alertType === 'error' ? 'error'
          : alertType === 'warning' ? 'warning'
          : 'info';
        break;
      }

      default:
        return; // Unknown event — don't show toast
    }

    if (message) {
      enqueueSnackbar(message, {
        variant,
        autoHideDuration: 5000,
      });
    }
  }, [lastEvent, enqueueSnackbar]);
};
