/**
 * Componente PaymentTable - Tabla de pagos (CHAT 2)
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  Chip
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  Cancel as FailedIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { Payment, PaymentType } from '../../types/payment';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

interface PaymentTableProps {
  payments: Payment[];
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (limit: number) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  pagination,
  onPageChange,
  onRowsPerPageChange
}) => {
  const navigate = useNavigate();

  const handleChangePage = (_: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage + 1);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  const getStatusChip = (status: string) => {
    const configs = {
      completed: {
        label: 'Completado',
        color: 'success' as const,
        icon: <CompletedIcon sx={{ fontSize: 16 }} />
      },
      pending: {
        label: 'Pendiente',
        color: 'warning' as const,
        icon: <PendingIcon sx={{ fontSize: 16 }} />
      },
      failed: {
        label: 'Fallido',
        color: 'error' as const,
        icon: <FailedIcon sx={{ fontSize: 16 }} />
      }
    };

    const config = configs[status as keyof typeof configs] || configs.completed;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getPaymentTypeChip = (type: PaymentType) => {
    const configs = {
      rental_payment: { label: 'Pago de Renta', color: '#8b5cf6' },
      deposit: { label: 'Depósito', color: '#3b82f6' },
      penalty: { label: 'Penalidad', color: '#ef4444' },
      refund: { label: 'Reembolso', color: '#10b981' }
    };

    const config = configs[type] || configs.rental_payment;

    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: `${config.color}20`,
          color: config.color,
          fontWeight: 500,
          border: `1px solid ${config.color}40`
        }}
      />
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Efectivo',
      credit_card: 'Tarjeta de Crédito',
      debit_card: 'Tarjeta de Débito',
      transfer: 'Transferencia',
      check: 'Cheque'
    };
    return methods[method] || method;
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Código</strong></TableCell>
            <TableCell><strong>Cliente</strong></TableCell>
            <TableCell><strong>Tipo</strong></TableCell>
            <TableCell><strong>Método</strong></TableCell>
            <TableCell><strong>Monto</strong></TableCell>
            <TableCell><strong>Fecha</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell><strong>Referencia</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <PaymentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay pagos registrados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Los pagos aparecerán aquí cuando se registren
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow
                key={payment.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/payments/${payment.id}`)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="600">
                    {payment.payment_code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {payment.customer?.first_name} {payment.customer?.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {payment.customer?.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  {getPaymentTypeChip(payment.payment_type)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getPaymentMethodLabel(payment.payment_method)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="600" color="primary">
                    {formatCurrency(payment.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(payment.transaction_date || payment.created_at || new Date())}
                  </Typography>
                </TableCell>
                <TableCell>
                  {getStatusChip(payment.status || 'completed')}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {payment.reference_number || 'N/A'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      )}
    </TableContainer>
  );
};

export default PaymentTable;
