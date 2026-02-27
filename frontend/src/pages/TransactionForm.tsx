import React, { useEffect, useState, useMemo } from 'react';
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
  alpha,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNavigate, useParams } from 'react-router-dom';
import accountingService from '../services/accountingService';
import { Account, CreateTransactionDto } from '../types/accounting';

interface LineItem {
  accountId: number;
  debit: number;
  credit: number;
  description: string;
}

const TransactionForm: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string>('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Simple mode form data
  const [formData, setFormData] = useState<CreateTransactionDto & { referenceNumber?: string }>({
    transactionType: 'income',
    accountId: 0,
    amount: 0,
    description: '',
    paymentMethod: 'cash',
    transactionDate: new Date().toISOString().split('T')[0],
    locationId: 1
  });

  // Advanced mode line items
  const [lines, setLines] = useState<LineItem[]>([
    { accountId: 0, debit: 0, credit: 0, description: '' },
    { accountId: 0, debit: 0, credit: 0, description: '' },
  ]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await accountingService.getAccounts();
      setAccounts(response.data.filter((acc: Account) => acc.isActive));
    } catch {
      setError('Error al cargar las cuentas');
    }
  };

  // Advanced mode calculations
  const totalDebit = useMemo(() => lines.reduce((sum, l) => sum + (l.debit || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, l) => sum + (l.credit || 0), 0), [lines]);
  const isBalanced = useMemo(() => Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0, [totalDebit, totalCredit]);

  const handleLineChange = (index: number, field: keyof LineItem, value: any) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addLine = () => {
    setLines(prev => [...prev, { accountId: 0, debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isAdvancedMode) {
        // Advanced mode validations
        if (!isBalanced) {
          setError('La transacción debe estar balanceada (Debe = Haber)');
          setLoading(false);
          return;
        }
        if (lines.some(l => !l.accountId)) {
          setError('Todas las líneas deben tener una cuenta asignada');
          setLoading(false);
          return;
        }
        if (lines.some(l => l.debit === 0 && l.credit === 0)) {
          setError('Cada línea debe tener un valor en Debe o Haber');
          setLoading(false);
          return;
        }

        await accountingService.createTransaction({
          transactionType: formData.transactionType,
          accountId: lines[0].accountId, // Primary account from first line
          amount: totalDebit,
          description: formData.description,
          paymentMethod: formData.paymentMethod,
          transactionDate: formData.transactionDate,
          locationId: formData.locationId,
          notes: formData.notes,
          lines: lines.filter(l => l.debit > 0 || l.credit > 0),
        });
      } else {
        // Simple mode validations
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
      }

      navigate('/accounting');
    } catch (error: any) {
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
            {/* Mode toggle */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdvancedMode}
                    onChange={(e) => setIsAdvancedMode(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500}>
                    Modo avanzado (partida doble)
                  </Typography>
                }
              />
              {isAdvancedMode && (
                <Typography variant="caption" color="text.secondary">
                  Defina las líneas de débito y crédito manualmente
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Transaction Type — only in simple mode */}
              {!isAdvancedMode && (
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
              )}

              {/* Account — only in simple mode */}
              {!isAdvancedMode && (
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
              )}

              {/* Destination Account (only for transfers, simple mode) */}
              {!isAdvancedMode && formData.transactionType === 'transfer' && (
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

              {/* Amount — only in simple mode */}
              {!isAdvancedMode && (
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
              )}

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
              {!isAdvancedMode && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Número de Referencia (Opcional)"
                    value={formData.referenceNumber || ''}
                    onChange={(e) => handleChange('referenceNumber' as keyof CreateTransactionDto, e.target.value)}
                    placeholder="Ej: TRANS-001, Factura #123"
                  />
                </Grid>
              )}

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
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
                  rows={2}
                  label="Notas Adicionales (Opcional)"
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Información adicional o comentarios sobre la transacción..."
                />
              </Grid>
            </Grid>

            {/* Advanced Mode: Line Items Table */}
            {isAdvancedMode && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Líneas Contables (Partida Doble)
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : alpha('#8b5cf6', 0.06) }}>
                        <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Cuenta</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Descripción</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">Debe</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">Haber</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 60 }} align="center" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={line.accountId}
                                onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value={0} disabled>Seleccionar cuenta</MenuItem>
                                {accounts.map(acc => (
                                  <MenuItem key={acc.id} value={acc.id}>
                                    {acc.accountCode} - {acc.accountName}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={line.description}
                              onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                              placeholder="Descripción..."
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={line.debit || ''}
                              onChange={(e) => handleLineChange(index, 'debit', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={line.credit || ''}
                              onChange={(e) => handleLineChange(index, 'credit', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => removeLine(index)}
                              disabled={lines.length <= 2}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight={700}>Totales</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color={isBalanced ? 'success.main' : 'error.main'}>
                            {formatCurrency(totalDebit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color={isBalanced ? 'success.main' : 'error.main'}>
                            {formatCurrency(totalCredit)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 1 }} size="small">
                  Agregar Línea
                </Button>

                {totalDebit > 0 && !isBalanced && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    La transacción no está balanceada. Debe ({formatCurrency(totalDebit)}) debe ser igual a Haber ({formatCurrency(totalCredit)}).
                  </Alert>
                )}

                {isBalanced && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Transacción balanceada correctamente.
                  </Alert>
                )}
              </Box>
            )}

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
                disabled={loading || (isAdvancedMode && !isBalanced)}
                sx={{
                  bgcolor: '#8b5cf6',
                  color: '#fff',
                  '&:hover': { bgcolor: '#7c3aed' },
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
            {isAdvancedMode ? 'Modo Avanzado — Partida Doble' : 'Información sobre tipos de transacciones'}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {isAdvancedMode ? (
              <>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Cada transacción debe tener <strong>Debe = Haber</strong> (suma de débitos igual a suma de créditos)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Activos y Gastos:</strong> Débito aumenta el saldo, Crédito lo disminuye
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Pasivos, Patrimonio e Ingresos:</strong> Crédito aumenta el saldo, Débito lo disminuye
                  </Typography>
                </li>
              </>
            ) : (
              <>
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
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransactionForm;
