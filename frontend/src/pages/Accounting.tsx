import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Collapse
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapHoriz as SwapHorizIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  FileDownload as DownloadIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import accountingService from '../services/accountingService';
import { Account, Transaction } from '../types/accounting';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import TabPanel from '../components/common/TabPanel';

const Accounting: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [balanceData, setBalanceData] = useState<any>(null);

  // Date filters for transactions
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [accountForm, setAccountForm] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'asset' as 'asset' | 'liability' | 'equity' | 'income' | 'expense',
    parentAccountId: undefined as number | undefined,
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const [accountsRes, transactionsRes, balanceRes] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getTransactions(filters),
        accountingService.getBalanceSheet()
      ]);

      setAccounts(accountsRes.data);
      setTransactions(transactionsRes.data);
      setBalanceData(balanceRes.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar los datos contables';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleApproveClick = () => {
    setApproveDialogOpen(true);
    handleMenuClose();
  };

  const handleApproveConfirm = async () => {
    if (!selectedItem) return;

    setApproving(true);
    try {
      await accountingService.approveTransaction(selectedItem.id);
      enqueueSnackbar('Transacción aprobada exitosamente', { variant: 'success' });
      setApproveDialogOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al aprobar la transacción';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const handleCancelClick = (_id: number) => {
    setCancelDialogOpen(true);
    handleMenuClose();
  };

  const handleCancelConfirm = async () => {
    if (!selectedItem || !cancelReason.trim()) {
      enqueueSnackbar('Por favor ingrese un motivo para cancelar', { variant: 'warning' });
      return;
    }

    try {
      await accountingService.cancelTransaction(selectedItem.id, cancelReason);
      enqueueSnackbar('Transacción cancelada exitosamente', { variant: 'success' });
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedItem(null);
      loadData();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cancelar la transacción';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleCreateAccount = () => {
    setEditMode(false);
    setAccountForm({
      accountCode: '',
      accountName: '',
      accountType: 'asset',
      parentAccountId: undefined,
      description: '',
      isActive: true
    });
    setAccountDialogOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditMode(true);
    setAccountForm({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      parentAccountId: account.parentAccountId,
      description: account.description || '',
      isActive: account.isActive
    });
    setAccountDialogOpen(true);
    handleMenuClose();
  };

  const handleSaveAccount = async () => {
    try {
      if (editMode && selectedItem) {
        await accountingService.updateAccount(selectedItem.id, accountForm);
        enqueueSnackbar('Cuenta actualizada exitosamente', { variant: 'success' });
      } else {
        await accountingService.createAccount(accountForm);
        enqueueSnackbar('Cuenta creada exitosamente', { variant: 'success' });
      }
      setAccountDialogOpen(false);
      loadData();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al guardar la cuenta';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleExportToExcel = () => {
    if (tabValue === 0) {
      // Export accounts
      const data = filteredAccounts.map(acc => ({
        'Código': acc.accountCode,
        'Nombre': acc.accountName,
        'Tipo': getAccountTypeConfig(acc.accountType).label,
        'Saldo': acc.balance,
        'Descripción': acc.description || '',
        'Estado': acc.isActive ? 'Activa' : 'Inactiva',
        'Cuenta Padre': acc.parentAccountId || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Catálogo de Cuentas');
      XLSX.writeFile(wb, `Cuentas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else {
      // Export transactions
      const data = filteredTransactions.map(trx => ({
        'Código': trx.transactionCode,
        'Fecha': format(new Date(trx.transactionDate), 'dd/MM/yyyy'),
        'Tipo': trx.transactionType,
        'Descripción': trx.description || '',
        'Monto': trx.amount,
        'Estado': trx.status,
        'Método de Pago': trx.paymentMethod || '',
        'Notas': trx.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
      XLSX.writeFile(wb, `Transacciones_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }
  };

  const getAccountTypeConfig = (type: string) => {
    const configs: any = {
      asset: { label: 'Activo', color: '#10b981', icon: <TrendingUpIcon /> },
      liability: { label: 'Pasivo', color: '#ef4444', icon: <TrendingDownIcon /> },
      equity: { label: 'Patrimonio', color: '#8b5cf6', icon: <AccountBalanceIcon /> },
      income: { label: 'Ingreso', color: '#3b82f6', icon: <MoneyIcon /> },
      expense: { label: 'Gasto', color: '#f59e0b', icon: <SwapHorizIcon /> }
    };
    return configs[type] || configs.asset;
  };

  const getTransactionStatusChip = (status: string) => {
    const configs: any = {
      pending: { label: 'Pendiente', color: '#f59e0b', icon: <PendingIcon /> },
      completed: { label: 'Aprobada', color: '#10b981', icon: <CheckCircleIcon /> },
      cancelled: { label: 'Cancelada', color: '#ef4444', icon: <CancelIcon /> }
    };
    const config = configs[status] || configs.pending;

    return (
      <Chip
        label={config.label}
        icon={config.icon}
        size="small"
        sx={{
          bgcolor: alpha(config.color, 0.1),
          color: config.color,
          border: 'none',
          '& .MuiChip-icon': { color: config.color }
        }}
      />
    );
  };

  const getTransactionTypeIcon = (type: string) => {
    const icons: any = {
      income: <TrendingUpIcon sx={{ color: '#10b981' }} />,
      expense: <TrendingDownIcon sx={{ color: '#ef4444' }} />,
      transfer: <SwapHorizIcon sx={{ color: '#3b82f6' }} />
    };
    return icons[type] || icons.transfer;
  };

  const buildAccountHierarchy = (accounts: Account[]): Account[] => {
    const accountMap = new Map<number, Account & { children: Account[] }>();
    const roots: (Account & { children: Account[] })[] = [];

    // Create map with all accounts
    accounts.forEach(acc => {
      accountMap.set(acc.id, { ...acc, children: [] });
    });

    // Build tree structure
    accounts.forEach(acc => {
      const node = accountMap.get(acc.id)!;
      if (acc.parentAccountId) {
        const parent = accountMap.get(acc.parentAccountId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const renderAccountRow = (account: Account & { children?: Account[] }, level: number = 0) => {
    const typeConfig = getAccountTypeConfig(account.accountType);
    const paddingLeft = level * 4;

    return (
      <React.Fragment key={account.id}>
        <TableRow hover>
          <TableCell>
            <Typography variant="body2" fontWeight={600} sx={{ pl: `${paddingLeft}rem` }}>
              {level > 0 && '└─ '}
              {account.accountCode}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2">{account.accountName}</Typography>
            {account.description && (
              <Typography variant="caption" color="text.secondary">
                {account.description}
              </Typography>
            )}
          </TableCell>
          <TableCell>
            <Chip
              label={typeConfig.label}
              icon={typeConfig.icon}
              size="small"
              sx={{
                bgcolor: alpha(typeConfig.color, 0.1),
                color: typeConfig.color,
                border: 'none',
                '& .MuiChip-icon': { color: typeConfig.color }
              }}
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight={600}>
              ${account.balance.toLocaleString()}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip
              label={account.isActive ? 'Activa' : 'Inactiva'}
              size="small"
              color={account.isActive ? 'success' : 'default'}
            />
          </TableCell>
          <TableCell align="right">
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, account)}
            >
              <MoreVertIcon />
            </IconButton>
          </TableCell>
        </TableRow>
        {account.children && account.children.map(child => renderAccountRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = accountTypeFilter === 'all' || account.accountType === accountTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredTransactions = transactions.filter(transaction =>
    transaction.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hierarchicalAccounts = buildAccountHierarchy(filteredAccounts);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalAssets = balanceData?.assets?.total || 0;
  const totalLiabilities = balanceData?.liabilities?.total || 0;
  const totalEquity = balanceData?.equity?.total || 0;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const isBalanced = balanceData?.balanceCheck !== false;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Contabilidad
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Gestión de cuentas y transacciones financieras
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportToExcel}
            sx={{
              borderColor: isDarkMode ? '#8b5cf6' : '#8b5cf6',
              color: isDarkMode ? '#8b5cf6' : '#8b5cf6',
              '&:hover': {
                borderColor: isDarkMode ? '#7c3aed' : '#7c3aed',
                bgcolor: alpha('#8b5cf6', 0.1)
              }
            }}
          >
            Exportar Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/accounting/transaction/new')}
            sx={{
              bgcolor: isDarkMode ? '#8b5cf6' : '#8b5cf6',
              color: '#fff',
              '&:hover': {
                bgcolor: isDarkMode ? '#7c3aed' : '#7c3aed'
              }
            }}
          >
            Nueva Transacción
          </Button>
        </Box>
      </Box>

      {/* Balance Sheet Warning */}
      <Collapse in={!isBalanced}>
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" fontWeight={600}>
            ⚠️ Balance Desbalanceado
          </Typography>
          <Typography variant="caption">
            El balance sheet no está cuadrado. Activos ({totalAssets.toLocaleString()}) ≠ Pasivos ({totalLiabilities.toLocaleString()}) + Patrimonio ({totalEquity.toLocaleString()})
          </Typography>
        </Alert>
      </Collapse>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Activos Totales
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                    ${totalAssets.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: '#10b981', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pasivos Totales
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#ef4444' }}>
                    ${totalLiabilities.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 40, color: '#ef4444', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Patrimonio
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#8b5cf6' }}>
                    ${totalEquity.toLocaleString()}
                  </Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: 40, color: '#8b5cf6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Transacciones Pendientes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b' }}>
                    {pendingTransactions}
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 40, color: '#f59e0b', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{
        mb: 3,
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600
            }
          }}
        >
          <Tab label="Catálogo de Cuentas" />
          <Tab label="Transacciones" />
        </Tabs>
      </Card>

      {/* Search and Filters */}
      <Card sx={{
        mb: 3,
        p: 2,
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por código, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {tabValue === 1 && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Inicio"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Fin"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </>
          )}

          {tabValue === 0 && (
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCreateAccount}
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Nueva Cuenta
                </Button>
                <Button
                  size="small"
                  variant={accountTypeFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setAccountTypeFilter('all')}
                >
                  Todas
                </Button>
                <Button
                  size="small"
                  variant={accountTypeFilter === 'asset' ? 'contained' : 'outlined'}
                  onClick={() => setAccountTypeFilter('asset')}
                  sx={{ color: accountTypeFilter === 'asset' ? '#fff' : '#10b981' }}
                >
                  Activos
                </Button>
                <Button
                  size="small"
                  variant={accountTypeFilter === 'liability' ? 'contained' : 'outlined'}
                  onClick={() => setAccountTypeFilter('liability')}
                  sx={{ color: accountTypeFilter === 'liability' ? '#fff' : '#ef4444' }}
                >
                  Pasivos
                </Button>
                <Button
                  size="small"
                  variant={accountTypeFilter === 'equity' ? 'contained' : 'outlined'}
                  onClick={() => setAccountTypeFilter('equity')}
                  sx={{ color: accountTypeFilter === 'equity' ? '#fff' : '#8b5cf6' }}
                >
                  Patrimonio
                </Button>
                <Button
                  size="small"
                  variant={accountTypeFilter === 'income' ? 'contained' : 'outlined'}
                  onClick={() => setAccountTypeFilter('income')}
                  sx={{ color: accountTypeFilter === 'income' ? '#fff' : '#3b82f6' }}
                >
                  Ingresos
                </Button>
                <Button
                  size="small"
                  variant={accountTypeFilter === 'expense' ? 'contained' : 'outlined'}
                  onClick={() => setAccountTypeFilter('expense')}
                  sx={{ color: accountTypeFilter === 'expense' ? '#fff' : '#f59e0b' }}
                >
                  Gastos
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Accounts Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : alpha('#8b5cf6', 0.1) }}>
                <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nombre de Cuenta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Saldo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hierarchicalAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron cuentas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hierarchicalAccounts.map(account => renderAccountRow(account))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Transactions Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : alpha('#8b5cf6', 0.1) }}>
                <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron transacciones
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {transaction.transactionCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(transaction.transactionDate), "d MMM yyyy", { locale: es })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTransactionTypeIcon(transaction.transactionType)}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {transaction.transactionType}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{transaction.description || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        ${transaction.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getTransactionStatusChip(transaction.status)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, transaction)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedItem && 'status' in selectedItem ? (
          <>
            {selectedItem.status === 'pending' && (
              <MenuItem onClick={handleApproveClick}>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 20, color: '#10b981' }} />
                Aprobar
              </MenuItem>
            )}
            {selectedItem.status !== 'cancelled' && (
              <MenuItem onClick={() => handleCancelClick(selectedItem.id)}>
                <CancelIcon sx={{ mr: 1, fontSize: 20, color: '#ef4444' }} />
                Cancelar
              </MenuItem>
            )}
          </>
        ) : (
          <MenuItem onClick={() => handleEditAccount(selectedItem)}>
            <EditIcon sx={{ mr: 1, fontSize: 20 }} />
            Editar Cuenta
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Transaction Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar Transacción</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Por favor ingrese el motivo de cancelación de la transacción.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo de Cancelación"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ej: Error en el monto ingresado..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={!cancelReason.trim()}
          >
            Confirmar Cancelación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Transaction Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => !approving && setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Aprobación</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ¿Está seguro de que desea aprobar esta transacción?
          </Typography>
          {selectedItem && (
            <Box sx={{ bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : alpha('#10b981', 0.1), p: 2, borderRadius: 1 }}>
              <Typography variant="body2"><strong>Código:</strong> {selectedItem.transactionCode}</Typography>
              <Typography variant="body2"><strong>Monto:</strong> ${selectedItem.amount?.toLocaleString()}</Typography>
              <Typography variant="body2"><strong>Tipo:</strong> {selectedItem.transactionType}</Typography>
            </Box>
          )}
          <Alert severity="info" sx={{ mt: 2 }}>
            Esta acción actualizará el saldo de la cuenta asociada y no podrá deshacerse.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={approving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleApproveConfirm}
            disabled={approving}
            startIcon={approving ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            {approving ? 'Aprobando...' : 'Confirmar Aprobación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Account Dialog (Create/Edit) */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código de Cuenta"
                value={accountForm.accountCode}
                onChange={(e) => setAccountForm({ ...accountForm, accountCode: e.target.value })}
                placeholder="Ej: 1100"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de Cuenta"
                value={accountForm.accountName}
                onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                placeholder="Ej: Caja"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select
                  value={accountForm.accountType}
                  label="Tipo de Cuenta"
                  onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value as any })}
                >
                  <MenuItem value="asset">Activo</MenuItem>
                  <MenuItem value="liability">Pasivo</MenuItem>
                  <MenuItem value="equity">Patrimonio</MenuItem>
                  <MenuItem value="income">Ingreso</MenuItem>
                  <MenuItem value="expense">Gasto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cuenta Padre (Opcional)</InputLabel>
                <Select
                  value={accountForm.parentAccountId || ''}
                  label="Cuenta Padre (Opcional)"
                  onChange={(e) => setAccountForm({ ...accountForm, parentAccountId: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <MenuItem value="">Ninguna (Cuenta Raíz)</MenuItem>
                  {accounts
                    .filter(acc => !editMode || acc.id !== selectedItem?.id)
                    .map(acc => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.accountCode} - {acc.accountName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={accountForm.description}
                onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                placeholder="Descripción de la cuenta..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={accountForm.isActive ? 'active' : 'inactive'}
                  label="Estado"
                  onChange={(e) => setAccountForm({ ...accountForm, isActive: e.target.value === 'active' })}
                >
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="inactive">Inactiva</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAccount}
            disabled={!accountForm.accountCode || !accountForm.accountName}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' }
            }}
          >
            {editMode ? 'Actualizar' : 'Crear'} Cuenta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounting;
