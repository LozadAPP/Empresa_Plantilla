/**
 * Pagina de Listado de Prospectos (CRM)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonSearch as LeadsIcon,
  Clear as ClearIcon,
  TrendingUp as WonIcon,
  TrendingDown as LostIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Handshake as NegotiationIcon,
  Description as ProposalIcon,
} from '@mui/icons-material';
import { FileDownload as ExportIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import TableSkeleton from '../components/common/TableSkeleton';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';
import { exportToCSV, LEADS_COLUMNS } from '../utils/exportCSV';
import { Lead, LeadStatus, LeadFilters, LeadPriority } from '../types/lead';
import leadService from '../services/leadService';

const getStatusConfig = (status: LeadStatus) => {
  const configs: Record<LeadStatus, { label: string; color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' }> = {
    [LeadStatus.NEW]: { label: 'Nuevo', color: 'info' },
    [LeadStatus.CONTACTED]: { label: 'Contactado', color: 'primary' },
    [LeadStatus.QUALIFIED]: { label: 'Calificado', color: 'success' },
    [LeadStatus.PROPOSAL]: { label: 'Propuesta', color: 'warning' },
    [LeadStatus.NEGOTIATION]: { label: 'Negociacion', color: 'warning' },
    [LeadStatus.WON]: { label: 'Ganado', color: 'success' },
    [LeadStatus.LOST]: { label: 'Perdido', color: 'error' },
  };
  return configs[status] || configs[LeadStatus.NEW];
};

const getPriorityConfig = (priority: LeadPriority) => {
  const configs: Record<LeadPriority, { label: string; color: 'default' | 'warning' | 'error' }> = {
    [LeadPriority.LOW]: { label: 'Baja', color: 'default' },
    [LeadPriority.MEDIUM]: { label: 'Media', color: 'warning' },
    [LeadPriority.HIGH]: { label: 'Alta', color: 'error' },
  };
  return configs[priority] || configs[LeadPriority.MEDIUM];
};

const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    web: 'Web',
    referral: 'Referido',
    cold_call: 'Llamada',
    event: 'Evento',
    social_media: 'Redes Sociales',
    other: 'Otro',
  };
  return labels[source] || source;
};

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const filters: LeadFilters = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (sourceFilter) filters.source = sourceFilter;

      const response = await leadService.getAll(filters);
      if (response.success) {
        setLeads(response.data.leads);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      enqueueSnackbar('Error al cargar prospectos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, sourceFilter, enqueueSnackbar]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, lead: Lead) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLead(null);
  };

  const handleDelete = async () => {
    if (!selectedLead) return;
    try {
      await leadService.delete(selectedLead.id);
      enqueueSnackbar('Prospecto eliminado', { variant: 'success' });
      fetchLeads();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al eliminar', { variant: 'error' });
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setPage(0);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      enqueueSnackbar('No hay datos para exportar', { variant: 'warning' });
      return;
    }
    exportToCSV(leads, LEADS_COLUMNS, 'prospectos');
    enqueueSnackbar('CSV exportado exitosamente', { variant: 'success' });
  };

  // Mobile card view
  const renderMobileCard = (lead: Lead) => {
    const statusConfig = getStatusConfig(lead.status);
    const priorityConfig = getPriorityConfig(lead.priority);
    return (
      <Card
        key={lead.id}
        sx={{
          mb: 1.5,
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb' },
        }}
        onClick={() => navigate(`/leads/${lead.id}`)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
              {lead.leadCode}
            </Typography>
            <Chip
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          </Stack>
          <Typography variant="body2" fontWeight={600}>
            {lead.name}
          </Typography>
          {lead.company && (
            <Typography variant="caption" color="text.secondary">
              {lead.company}
            </Typography>
          )}
          <Stack direction="row" justifyContent="space-between" mt={1} alignItems="center">
            <Chip label={priorityConfig.label} color={priorityConfig.color} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0075ff' }}>
              {formatCurrency(lead.estimatedValue)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
            Prospectos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount} prospecto{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/leads/new')}
            sx={{
              background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': { background: 'linear-gradient(90deg, #db2777 0%, #ec4899 100%)' },
            }}
          >
            Nuevo Prospecto
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '16px',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por nombre, empresa, codigo..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="new">Nuevo</MenuItem>
              <MenuItem value="contacted">Contactado</MenuItem>
              <MenuItem value="qualified">Calificado</MenuItem>
              <MenuItem value="proposal">Propuesta</MenuItem>
              <MenuItem value="negotiation">Negociacion</MenuItem>
              <MenuItem value="won">Ganado</MenuItem>
              <MenuItem value="lost">Perdido</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Fuente</InputLabel>
            <Select
              label="Fuente"
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="web">Web</MenuItem>
              <MenuItem value="referral">Referido</MenuItem>
              <MenuItem value="cold_call">Llamada</MenuItem>
              <MenuItem value="event">Evento</MenuItem>
              <MenuItem value="social_media">Redes Sociales</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </Select>
          </FormControl>
          {(search || statusFilter || sourceFilter) && (
            <IconButton onClick={clearFilters} size="small" title="Limpiar filtros">
              <ClearIcon />
            </IconButton>
          )}
        </Stack>
      </Paper>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<LeadsIcon sx={{ fontSize: 48 }} />}
          title="No hay prospectos"
          subtitle={search || statusFilter || sourceFilter
            ? 'No se encontraron prospectos con los filtros aplicados'
            : 'Crea tu primer prospecto para empezar el pipeline de ventas'}
        />
      ) : isMobile ? (
        <Box>
          {leads.map(renderMobileCard)}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            labelRowsPerPage="Por pagina"
          />
        </Box>
      ) : (
        <Paper
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(236,72,153,0.08)' : '#fdf2f8' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Codigo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre / Empresa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fuente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Prioridad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Valor Est.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Seguimiento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Asignado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => {
                  const statusConfig = getStatusConfig(lead.status);
                  const priorityConfig = getPriorityConfig(lead.priority);
                  return (
                    <TableRow
                      key={lead.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isDarkMode ? 'rgba(236,72,153,0.06)' : '#fef7ff' },
                      }}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#ec4899' }}>
                          {lead.leadCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{lead.name}</Typography>
                        {lead.company && (
                          <Typography variant="caption" color="text.secondary">{lead.company}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{getSourceLabel(lead.source)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={priorityConfig.label}
                          color={priorityConfig.color}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(lead.estimatedValue)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {lead.nextFollowUp ? (
                          <Typography variant="body2" sx={{
                            color: new Date(lead.nextFollowUp) < new Date() ? '#ef4444' : 'text.secondary',
                            fontWeight: new Date(lead.nextFollowUp) < new Date() ? 600 : 400,
                          }}>
                            {formatDate(lead.nextFollowUp)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.assignee
                          ? `${lead.assignee.first_name} ${lead.assignee.last_name}`
                          : <Typography variant="body2" color="text.secondary">Sin asignar</Typography>
                        }
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, lead)}>
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            labelRowsPerPage="Por pagina"
          />
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: isDarkMode ? '#1c1c2e' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
          },
        }}
      >
        <MenuItem onClick={() => { navigate(`/leads/${selectedLead?.id}`); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1.5, fontSize: 20 }} /> Ver detalle
        </MenuItem>
        {selectedLead && selectedLead.status !== 'won' && selectedLead.status !== 'lost' && (
          <MenuItem onClick={() => { navigate(`/leads/${selectedLead?.id}/edit`); handleMenuClose(); }}>
            <EditIcon sx={{ mr: 1.5, fontSize: 20 }} /> Editar
          </MenuItem>
        )}
        {selectedLead?.status === 'new' && (
          <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: '#ef4444' }}>
            <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} /> Eliminar
          </MenuItem>
        )}
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar prospecto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estas seguro de que deseas eliminar el prospecto {selectedLead?.leadCode} — {selectedLead?.name}? Esta accion no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leads;
