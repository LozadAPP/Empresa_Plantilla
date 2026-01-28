import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Paper,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  History as HistoryIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CompletedIcon,
  Schedule as ActiveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { customerService } from '../../services/customerService';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

interface CustomerRentalsDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: number;
  customerName: string;
}

const CustomerRentalsDialog: React.FC<CustomerRentalsDialogProps> = ({
  open,
  onClose,
  customerId,
  customerName
}) => {
  const { isDarkMode } = useCustomTheme();
  const [rentals, setRentals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (open && customerId) {
      fetchRentals();
    }
  }, [open, customerId, page, rowsPerPage]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getRentals(customerId, page + 1, rowsPerPage);

      if (response.success) {
        setRentals(response.data || []);
        setSummary(response.summary);
        setTotal(response.pagination?.total || 0);
      } else {
        setError('Error al cargar historial de rentas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Error fetching rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error'> = {
      pending: 'default',
      active: 'primary',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle component="div">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />
          <Box>
            <Typography variant="h6" component="span" fontWeight={600}>
              Historial de Rentas
            </Typography>
            <Typography variant="caption" component="p" color="text.secondary">
              {customerName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && !rentals.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                      borderRadius: '12px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MoneyIcon sx={{ color: '#8b5cf6', fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {formatCurrency(summary.totalSpent)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Gastado
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                      borderRadius: '12px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CarIcon sx={{ color: '#10b981', fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {summary.totalRentals}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Rentas
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                      borderRadius: '12px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <ActiveIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {summary.activeRentals}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Rentas Activas
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
                      borderRadius: '12px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CompletedIcon sx={{ color: '#22c55e', fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {summary.completedRentals}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completadas
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Rentals Table */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="body2" fontWeight="600">Fecha Inicio</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight="600">Fecha Fin</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight="600">Vehículo</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight="600">Estado</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight="600">Monto Total</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight="600">Depósito</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rentals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No hay rentas registradas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Este cliente aún no ha realizado rentas
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rentals.map((rental) => (
                      <TableRow key={rental.id} hover>
                        <TableCell>
                          <Typography variant="body2">{formatDate(rental.start_date)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(rental.end_date)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {rental.vehicle?.make} {rental.vehicle?.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rental.vehicle?.license_plate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(rental.status)}
                            color={getStatusColor(rental.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="600">
                            {formatCurrency(rental.total_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(rental.deposit_amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {rentals.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={total}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Rentas por página"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              )}
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CloseIcon />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 500 }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerRentalsDialog;
