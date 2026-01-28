import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as EntryIcon,
  TrendingDown as ExitIcon,
  SwapHoriz as TransferIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { inventoryService } from '../../services/inventoryService';
import { InventoryItem, InventoryMovement } from '../../types/inventory';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

interface ItemDetailsModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onEdit?: (item: InventoryItem) => void;
  onNewMovement?: (item: InventoryItem) => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  open,
  onClose,
  item,
  onEdit,
  onNewMovement,
}) => {
  const { isDarkMode } = useCustomTheme();

  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      loadMovementHistory();
    }
  }, [open, item]);

  const loadMovementHistory = async () => {
    if (!item) return;

    setLoading(true);
    setError(null);
    try {
      const response = await inventoryService.getItemHistory(item.id);
      setMovements(response.data || []);
    } catch (err) {
      setError('Error al cargar el historial de movimientos');
      console.error('Error loading movement history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: '#10b981',
      rented: '#3b82f6',
      maintenance: '#f59e0b',
      sold: '#8b5cf6',
      retired: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponible',
      rented: 'Rentado',
      maintenance: 'Mantenimiento',
      sold: 'Vendido',
      retired: 'Retirado',
    };
    return labels[status] || status;
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      excellent: 'Excelente',
      good: 'Bueno',
      fair: 'Regular',
      poor: 'Malo',
    };
    return labels[condition] || condition;
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return <EntryIcon sx={{ fontSize: 20 }} />;
      case 'exit':
        return <ExitIcon sx={{ fontSize: 20 }} />;
      case 'transfer':
        return <TransferIcon sx={{ fontSize: 20 }} />;
      default:
        return <HistoryIcon sx={{ fontSize: 20 }} />;
    }
  };

  const getMovementColor = (type: string) => {
    const colors: Record<string, string> = {
      entry: '#10b981',
      exit: '#ef4444',
      transfer: '#3b82f6',
    };
    return colors[type] || '#6b7280';
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      entry: 'Entrada',
      exit: 'Salida',
      transfer: 'Transferencia',
    };
    return labels[type] || type;
  };

  const getMovementSubtypeLabel = (subtype: string) => {
    const labels: Record<string, string> = {
      rental: 'Renta',
      sale: 'Venta',
      purchase: 'Compra',
      return: 'Devolución',
      transfer: 'Transferencia',
      maintenance: 'Mantenimiento',
    };
    return labels[subtype] || subtype;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadDocument = async (movement: InventoryMovement) => {
    try {
      const response = await inventoryService.downloadMovementDocument(movement.id);

      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${movement.movementNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Error al descargar el documento');
    }
  };

  if (!item) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" component="span" fontWeight={700}>
            {item.name}
          </Typography>
          <Typography variant="body2" component="p" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.serialNumber} • {item.categoryName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onEdit && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => onEdit(item)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Editar
            </Button>
          )}
          {onNewMovement && (
            <Button
              variant="contained"
              startIcon={<TransferIcon />}
              onClick={() => onNewMovement(item)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#8b5cf6',
                '&:hover': {
                  backgroundColor: '#7c3aed',
                },
              }}
            >
              Nuevo Movimiento
            </Button>
          )}
          <IconButton onClick={onClose} sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Información General */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 3,
                backgroundColor: isDarkMode ? '#13131f' : '#f8f9fa',
                border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Información General
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Estado
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getStatusLabel(item.status)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(item.status),
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Condición
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                      {getConditionLabel(item.condition)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tipo
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                      {item.type}
                    </Typography>
                  </Box>

                  {item.internalCode && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Código Interno
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        {item.internalCode}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Ubicación Actual */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 3,
                backgroundColor: isDarkMode ? '#13131f' : '#f8f9fa',
                border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationIcon sx={{ color: '#8b5cf6' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Ubicación Actual
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {item.currentLocationName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.currentLocationCity}, {item.currentLocationState}
                    </Typography>
                  </Box>

                  {item.currentCompany && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cliente/Empresa
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        {item.currentCompany}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Coordenadas GPS
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{ mt: 0.5 }}
                    >
                      {item.currentLocationCoordinates.lat.toFixed(6)},{' '}
                      {item.currentLocationCoordinates.lng.toFixed(6)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Valores */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 3,
                backgroundColor: isDarkMode ? '#13131f' : '#f8f9fa',
                border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MoneyIcon sx={{ color: '#10b981' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Valores
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Valor Actual
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                      ${item.currentValue?.toLocaleString('es-MX')}
                    </Typography>
                  </Box>

                  {item.purchasePrice && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Precio de Compra
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        ${item.purchasePrice.toLocaleString('es-MX')}
                      </Typography>
                    </Box>
                  )}

                  {item.rentalPriceDaily && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Precio de Renta Diario
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        ${item.rentalPriceDaily.toLocaleString('es-MX')} / día
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Fechas */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 3,
                backgroundColor: isDarkMode ? '#13131f' : '#f8f9fa',
                border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon sx={{ color: '#3b82f6' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Fechas Importantes
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {item.purchaseDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Fecha de Compra
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        {formatDate(item.purchaseDate)}
                      </Typography>
                    </Box>
                  )}

                  {item.lastMaintenanceDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Último Mantenimiento
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        {formatDate(item.lastMaintenanceDate)}
                      </Typography>
                    </Box>
                  )}

                  {item.nextMaintenanceDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Próximo Mantenimiento
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        {formatDate(item.nextMaintenanceDate)}
                      </Typography>
                    </Box>
                  )}

                  {item.lastMovementDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Último Movimiento
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                        {formatDate(item.lastMovementDate)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Notas */}
          {item.notes && (
            <Grid item xs={12}>
              <Card
                sx={{
                  borderRadius: 3,
                  backgroundColor: isDarkMode ? '#13131f' : '#f8f9fa',
                  border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    Notas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.notes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Historial de Movimientos */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <HistoryIcon sx={{ color: '#8b5cf6' }} />
              <Typography variant="h6" fontWeight={700}>
                Historial de Movimientos
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : movements.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay movimientos registrados para este artículo
                </Typography>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', pl: 4 }}>
                {movements.map((movement, index) => (
                  <Box
                    key={movement.id}
                    sx={{
                      position: 'relative',
                      pb: index < movements.length - 1 ? 3 : 0,
                    }}
                  >
                    {/* Timeline line */}
                    {index < movements.length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '-28px',
                          top: '40px',
                          bottom: '-12px',
                          width: '2px',
                          backgroundColor: isDarkMode ? '#2d2d44' : '#e5e7eb',
                        }}
                      />
                    )}

                    {/* Timeline dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '-36px',
                        top: '8px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: getMovementColor(movement.movementType),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    >
                      {getMovementIcon(movement.movementType)}
                    </Box>

                    {/* Movement card */}
                    <Card
                      sx={{
                        borderRadius: 2,
                        backgroundColor: isDarkMode ? '#13131f' : '#f8f9fa',
                        border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 1 }}
                        >
                          {formatDateTime(movement.movementDate)}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            label={getMovementTypeLabel(movement.movementType)}
                            size="small"
                            sx={{
                              backgroundColor: getMovementColor(movement.movementType),
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                          <Chip
                            label={getMovementSubtypeLabel(movement.movementSubtype)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>

                        <Typography variant="body2" fontWeight={600}>
                          {movement.toLocationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {movement.toLocationCity}, {movement.toLocationState}
                        </Typography>

                        {movement.notes && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
                          >
                            {movement.notes}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 2,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontStyle: 'italic' }}
                          >
                            Por: {movement.userName}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(movement);
                            }}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              color: '#8b5cf6',
                              '&:hover': {
                                backgroundColor: isDarkMode
                                  ? 'rgba(139, 92, 246, 0.1)'
                                  : 'rgba(139, 92, 246, 0.05)',
                              },
                            }}
                          >
                            Descargar PDF
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailsModal;
