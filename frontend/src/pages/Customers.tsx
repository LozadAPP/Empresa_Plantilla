import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountBalance as GovIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { customerService } from '../services/customerService';
import { Customer, CustomerType, CustomerFilters, Pagination, CustomerFormData } from '../types';
import { useAuth } from '../hooks/useAuth';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CustomerForm from '../components/forms/CustomerForm';
import CustomerRentalsDialog from '../components/dialogs/CustomerRentalsDialog';

const typeIcons: Record<CustomerType, React.ReactNode> = {
  individual: <PersonIcon fontSize="small" />,
  corporate: <BusinessIcon fontSize="small" />,
  government: <GovIcon fontSize="small" />
};

const typeLabels: Record<CustomerType, string> = {
  individual: 'Individual',
  corporate: 'Empresarial',
  government: 'Gobierno'
};

const Customers: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const canEdit = hasAnyRole('admin', 'director_general', 'jefe_ventas', 'vendedor');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');

  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // View Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Delete Confirm Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create/Edit Customer Dialog
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerFormMode, setCustomerFormMode] = useState<'create' | 'edit'>('create');
  const [customerFormLoading, setCustomerFormLoading] = useState(false);

  // Rentals History Dialog
  const [rentalsDialogOpen, setRentalsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, typeFilter, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        fetchCustomers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const filters: CustomerFilters = {};
      if (search) filters.search = search;
      if (typeFilter) filters.customer_type = typeFilter;
      if (activeFilter !== '') filters.is_active = activeFilter as boolean;

      const response = await customerService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        filters
      });

      if (response.success) {
        setCustomers(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError('Error al cargar clientes');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination((prev) => ({ ...prev, limit: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleToggleActive = async () => {
    if (!selectedCustomer) return;
    try {
      await customerService.toggleActive(selectedCustomer.id);
      fetchCustomers();
    } catch (err) {
      setError('Error al cambiar estado');
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;
    setDeleteLoading(true);
    try {
      await customerService.delete(selectedCustomer.id);
      setDeleteDialogOpen(false);
      fetchCustomers();
      enqueueSnackbar('Cliente eliminado correctamente', { variant: 'success' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar cliente';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Create/Edit functions
  const handleCreateClick = () => {
    setCustomerFormMode('create');
    setCustomerFormOpen(true);
  };

  const handleEditClick = () => {
    setCustomerFormMode('edit');
    setCustomerFormOpen(true);
    handleMenuClose();
  };

  const handleCustomerFormSubmit = async (data: CustomerFormData) => {
    setCustomerFormLoading(true);
    try {
      if (customerFormMode === 'create') {
        await customerService.create(data);
      } else if (selectedCustomer) {
        await customerService.update(selectedCustomer.id, data);
      }
      setCustomerFormOpen(false);
      fetchCustomers();
      setError(null);
    } catch (err) {
      setError(customerFormMode === 'create' ? 'Error al crear cliente' : 'Error al actualizar cliente');
      throw err;
    } finally {
      setCustomerFormLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Gestión de Clientes
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Nuevo Cliente
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar por nombre, email, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={typeFilter}
              label="Tipo"
              onChange={(e) => setTypeFilter(e.target.value as CustomerType | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="individual">Individual</MenuItem>
              <MenuItem value="corporate">Empresarial</MenuItem>
              <MenuItem value="government">Gobierno</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={activeFilter}
              label="Estado"
              onChange={(e) => setActiveFilter(e.target.value as boolean | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={true as unknown as string}>Activos</MenuItem>
              <MenuItem value={false as unknown as string}>Inactivos</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Límite Crédito</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{customer.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {customer.city}, {customer.country}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.contact_person || '-'}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={typeIcons[customer.customer_type] as React.ReactElement}
                        label={typeLabels[customer.customer_type]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${customer.credit_limit?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.is_active ? 'Activo' : 'Inactivo'}
                        color={customer.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, customer)}>
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No se encontraron clientes</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={handleChangePage}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </TableContainer>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" /> Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => { setRentalsDialogOpen(true); handleMenuClose(); }}>
          <HistoryIcon sx={{ mr: 1 }} fontSize="small" /> Ver Historial de Rentas
        </MenuItem>
        {canEdit && (
          <>
            <MenuItem onClick={handleEditClick}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" /> Editar
            </MenuItem>
            <MenuItem onClick={handleToggleActive}>
              {selectedCustomer?.is_active ? 'Desactivar' : 'Activar'}
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" /> Eliminar
            </MenuItem>
          </>
        )}
      </Menu>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalles del Cliente</DialogTitle>
        <DialogContent dividers>
          {selectedCustomer && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Nombre</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Tipo</Typography>
                <Chip
                  icon={typeIcons[selectedCustomer.customer_type] as React.ReactElement}
                  label={typeLabels[selectedCustomer.customer_type]}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Contacto</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer.contact_person || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer.email || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Teléfono</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">RFC/Tax ID</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer.tax_id || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Dirección</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedCustomer.address || '-'}, {selectedCustomer.city}, {selectedCustomer.country}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">Límite de Crédito</Typography>
                <Typography variant="body1" gutterBottom>${selectedCustomer.credit_limit?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">Términos de Pago</Typography>
                <Typography variant="body1" gutterBottom>Net {selectedCustomer.payment_terms} días</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">Descuento</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer.discount_percentage}%</Typography>
              </Grid>
              {selectedCustomer.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Notas</Typography>
                  <Typography variant="body1">{selectedCustomer.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmar Eliminación"
        message={`¿Está seguro que desea eliminar el cliente "${selectedCustomer?.name}"? Esta acción no se puede deshacer.`}
        severity="error"
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColor="error"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Create/Edit Customer Dialog */}
      <CustomerForm
        open={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        onSubmit={handleCustomerFormSubmit}
        loading={customerFormLoading}
        editMode={customerFormMode === 'edit'}
        initialData={selectedCustomer || undefined}
      />

      {/* Customer Rentals History Dialog */}
      {selectedCustomer && (
        <CustomerRentalsDialog
          open={rentalsDialogOpen}
          onClose={() => setRentalsDialogOpen(false)}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
        />
      )}
    </Box>
  );
};

export default Customers;
