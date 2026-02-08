import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Alert,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import accountingService from '../services/accountingService';
import { Account, CreateTransactionDto } from '../types/accounting';

const TransactionForm: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<CreateTransactionDto & { referenceNumber?: string }>({
    transactionType: 'income',
    accountId: 0,
    amount: 0,
    description: '',
    paymentMethod: 'cash',
    transactionDate: new Date().toISOString().split('T')[0],
    locationId: 1
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await accountingService.getAccounts();
      setAccounts(response.data.filter((acc: Account) => acc.isActive));
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Error al cargar las cuentas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.amount <= 0) {
        setError('El monto debe ser mayor a 0');
        setLoading(false);
        return;
      }

      if (!formData.accountId) {
        setError('Debe seleccionar una cuenta');
        setLoading(false);
        return;
      }

      if (formData.transactionType === 'transfer') {
        if (!formData.destinationAccountId) {
          setError('Debe seleccionar una cuenta destino para transferencias');
          setLoading(false);
          return;
        }
        if (formData.destinationAccountId === formData.accountId) {
          setError('La cuenta destino debe ser diferente a la cuenta origen');
          setLoading(false);
          return;
        }
      }

      await accountingService.createTransaction(formData);
      navigate('/accounting');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      setError(error.response?.data?.message || 'Error al guardar la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateTransactionDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const transactionTypes = [
    { value: 'income', label: 'Ingreso' },
    { value: 'expense', label: 'Gasto' },
    { value: 'transfer', label: 'Transferencia' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia Bancaria' },
    { value: 'check', label: 'Cheque' },
    { value: 'other', label: 'Otro' }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
          {isEdit ? 'Editar Transacción' : 'Nueva Transacción'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Complete los datos de la transacción financiera
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* Transaction Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Transacción</InputLabel>
                  <Select
                    value={formData.transactionType}
                    onChange={(e) => handleChange('transactionType', e.target.value)}
                    label="Tipo de Transacción"
                  >
                    {transactionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Account */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{formData.transactionType === 'transfer' ? 'Cuenta Origen' : 'Cuenta'}</InputLabel>
                  <Select
                    value={formData.accountId}
                    onChange={(e) => handleChange('accountId', e.target.value)}
                    label={formData.transactionType === 'transfer' ? 'Cuenta Origen' : 'Cuenta'}
                  >
                    <MenuItem value={0} disabled>
                      Seleccione una cuenta
                    </MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.accountCode} - {account.accountName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Destination Account (only for transfers) */}
              {formData.transactionType === 'transfer' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cuenta Destino</InputLabel>
                    <Select
                      value={formData.destinationAccountId || 0}
                      onChange={(e) => handleChange('destinationAccountId' as keyof CreateTransactionDto, e.target.value)}
                      label="Cuenta Destino"
                    >
                      <MenuItem value={0} disabled>
                        Seleccione cuenta destino
                      </MenuItem>
                      {accounts
                        .filter((acc) => acc.id !== formData.accountId)
                        .map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.accountCode} - {account.accountName}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Amount */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Monto"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </Grid>

              {/* Payment Method */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    label="Método de Pago"
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Transaction Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Fecha de Transacción"
                  value={formData.transactionDate}
                  onChange={(e) => handleChange('transactionDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>

              {/* Reference Number */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número de Referencia (Opcional)"
                  value={formData.referenceNumber || ''}
                  onChange={(e) => handleChange('referenceNumber' as keyof CreateTransactionDto, e.target.value)}
                  placeholder="Ej: TRANS-001, Factura #123"
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe el motivo o concepto de esta transacción..."
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notas Adicionales (Opcional)"
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Información adicional o comentarios sobre la transacción..."
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/accounting')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
                sx={{
                  bgcolor: isDarkMode ? '#8b5cf6' : '#8b5cf6',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: isDarkMode ? '#7c3aed' : '#7c3aed'
                  }
                }}
              >
                {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Transacción'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>

      {/* Help Card */}
      <Card sx={{ mt: 3, bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : alpha('#3b82f6', 0.05) }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#3b82f6' }}>
            Información sobre tipos de transacciones
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Ingreso:</strong> Registra entradas de dinero a la cuenta seleccionada
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Gasto:</strong> Registra salidas de dinero de la cuenta seleccionada
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Transferencia:</strong> Mueve dinero entre cuentas (requiere cuenta origen y destino)
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransactionForm;
