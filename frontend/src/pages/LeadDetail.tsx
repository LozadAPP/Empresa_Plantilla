/**
 * Vista de detalle de Prospecto
 * Muestra info, pipeline, actividades y conversion a cliente
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PersonAdd as ConvertIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as CompanyIcon,
  Person as PersonIcon,
  AttachMoney as ValueIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as WonIcon,
  TrendingDown as LostIcon,
  Add as AddIcon,
  CheckCircle as CompleteIcon,
  Notes as NoteIcon,
  Videocam as MeetingIcon,
  Description as ProposalIcon,
  Schedule as FollowUpIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatDate } from '../utils/formatters';
import {
  Lead,
  LeadStatus,
  LeadPriority,
  LeadActivity,
  ActivityType,
} from '../types/lead';
import leadService from '../services/leadService';

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociacion',
  won: 'Ganado',
  lost: 'Perdido',
};

const STATUS_COLORS: Record<string, 'info' | 'primary' | 'success' | 'warning' | 'error' | 'default'> = {
  new: 'info',
  contacted: 'primary',
  qualified: 'success',
  proposal: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'error',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  referral: 'Referido',
  cold_call: 'Llamada en Frio',
  event: 'Evento',
  social_media: 'Redes Sociales',
  other: 'Otro',
};

const ACTIVITY_ICONS: Record<string, React.ReactElement> = {
  call: <PhoneIcon sx={{ fontSize: 18 }} />,
  email: <EmailIcon sx={{ fontSize: 18 }} />,
  meeting: <MeetingIcon sx={{ fontSize: 18 }} />,
  note: <NoteIcon sx={{ fontSize: 18 }} />,
  follow_up: <FollowUpIcon sx={{ fontSize: 18 }} />,
  proposal: <ProposalIcon sx={{ fontSize: 18 }} />,
};

const ACTIVITY_LABELS: Record<string, string> = {
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunion',
  note: 'Nota',
  follow_up: 'Seguimiento',
  proposal: 'Propuesta',
};

// Pipeline transitions
const NEXT_STATUSES: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
};

const LeadDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { enqueueSnackbar } = useSnackbar();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [createQuote, setCreateQuote] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState('note');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityScheduledAt, setActivityScheduledAt] = useState('');

  const loadLead = async () => {
    try {
      const response = await leadService.getById(Number(id));
      if (response.success) {
        setLead(response.data);
      }
    } catch (error) {
      enqueueSnackbar('Error al cargar prospecto', { variant: 'error' });
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadLead();
  }, [id]);

  // --- Handlers ---

  const handleChangeStatus = async () => {
    if (!selectedStatus) return;
    if (selectedStatus === 'lost' && !lostReason.trim()) {
      enqueueSnackbar('Se requiere una razon para marcar como perdido', { variant: 'warning' });
      return;
    }
    setActionLoading(true);
    try {
      await leadService.changeStatus(Number(id), selectedStatus, selectedStatus === 'lost' ? lostReason : undefined);
      enqueueSnackbar(`Estado cambiado a "${STATUS_LABELS[selectedStatus]}"`, { variant: 'success' });
      setStatusDialogOpen(false);
      setSelectedStatus('');
      setLostReason('');
      loadLead();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al cambiar estado', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async () => {
    setActionLoading(true);
    try {
      const response = await leadService.convertToCustomer(Number(id), createQuote);
      enqueueSnackbar(response.message || 'Prospecto convertido a cliente', { variant: 'success' });
      setConvertDialogOpen(false);
      if (response.data?.customer?.id) {
        navigate(`/customers/${response.data.customer.id}`);
      } else {
        loadLead();
      }
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al convertir', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityDescription.trim()) {
      enqueueSnackbar('La descripcion es requerida', { variant: 'warning' });
      return;
    }
    setActionLoading(true);
    try {
      await leadService.addActivity(Number(id), {
        activityType,
        description: activityDescription.trim(),
        scheduledAt: activityScheduledAt || undefined,
      });
      enqueueSnackbar('Actividad agregada', { variant: 'success' });
      setActivityDialogOpen(false);
      setActivityType('note');
      setActivityDescription('');
      setActivityScheduledAt('');
      loadLead();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al agregar actividad', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteActivity = async (activityId: number) => {
    try {
      await leadService.completeActivity(Number(id), activityId);
      enqueueSnackbar('Actividad completada', { variant: 'success' });
      loadLead();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error', { variant: 'error' });
    }
  };

  const paperSx = {
    p: 3,
    borderRadius: '16px',
    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Prospecto no encontrado</Typography>
        <Button onClick={() => navigate('/leads')} sx={{ mt: 2 }}>Volver a prospectos</Button>
      </Box>
    );
  }

  const nextStatuses = NEXT_STATUSES[lead.status] || [];
  const isClosed = lead.status === 'won' || lead.status === 'lost';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/leads')} sx={{ color: 'text.secondary', textTransform: 'none' }}>
            Volver
          </Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
                {lead.leadCode}
              </Typography>
              <Chip
                label={STATUS_LABELS[lead.status] || lead.status}
                color={STATUS_COLORS[lead.status] || 'default'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Creado el {formatDate(lead.createdAt)} {lead.creator && `por ${lead.creator.first_name} ${lead.creator.last_name}`}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!isClosed && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/leads/${lead.id}/edit`)}
              sx={{ borderRadius: '12px', textTransform: 'none' }}
            >
              Editar
            </Button>
          )}
          {nextStatuses.length > 0 && nextStatuses.filter(s => s !== 'lost').map((status) => (
            <Button
              key={status}
              variant="contained"
              onClick={() => { setSelectedStatus(status); setStatusDialogOpen(true); }}
              disabled={actionLoading}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: status === 'won'
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #ec4899, #f472b6)',
                '&:hover': {
                  background: status === 'won'
                    ? 'linear-gradient(90deg, #059669, #10b981)'
                    : 'linear-gradient(90deg, #db2777, #ec4899)',
                },
              }}
            >
              {STATUS_LABELS[status]}
            </Button>
          ))}
          {nextStatuses.includes('lost') && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<LostIcon />}
              onClick={() => { setSelectedStatus('lost'); setStatusDialogOpen(true); }}
              disabled={actionLoading}
              sx={{ borderRadius: '12px', textTransform: 'none' }}
            >
              Marcar Perdido
            </Button>
          )}
          {lead.status === 'won' && !lead.customerId && (
            <Button
              variant="contained"
              startIcon={<ConvertIcon />}
              onClick={() => setConvertDialogOpen(true)}
              disabled={actionLoading}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(90deg, #0075ff, #21d4fd)',
                '&:hover': { background: 'linear-gradient(90deg, #0060cc, #1ab8e0)' },
              }}
            >
              Convertir a Cliente
            </Button>
          )}
          {lead.customerId && (
            <Button
              variant="outlined"
              onClick={() => navigate(`/customers/${lead.customerId}`)}
              sx={{ borderRadius: '12px', textTransform: 'none' }}
            >
              Ver Cliente
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left - Details */}
        <Grid item xs={12} md={8}>
          {/* Contact Info */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Informacion de Contacto
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 18, color: '#ec4899' }} />
                  <Typography variant="body2" color="text.secondary">Nombre</Typography>
                </Box>
                <Typography variant="body1" fontWeight={600}>{lead.name}</Typography>
              </Grid>
              {lead.company && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <CompanyIcon sx={{ fontSize: 18, color: '#ec4899' }} />
                    <Typography variant="body2" color="text.secondary">Empresa</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600}>{lead.company}</Typography>
                </Grid>
              )}
              {lead.email && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 18, color: '#ec4899' }} />
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                  </Box>
                  <Typography variant="body1">{lead.email}</Typography>
                </Grid>
              )}
              {lead.phone && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 18, color: '#ec4899' }} />
                    <Typography variant="body2" color="text.secondary">Telefono</Typography>
                  </Box>
                  <Typography variant="body1">{lead.phone}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Business Info */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Informacion del Negocio
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Fuente</Typography>
                <Typography variant="body1" fontWeight={600}>{SOURCE_LABELS[lead.source] || lead.source}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Prioridad</Typography>
                <Chip
                  label={PRIORITY_LABELS[lead.priority] || lead.priority}
                  color={lead.priority === 'high' ? 'error' : lead.priority === 'medium' ? 'warning' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Valor Estimado</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: '#0075ff' }}>
                  {formatCurrency(lead.estimatedValue)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Proximo Seguimiento</Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    color: lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date() ? '#ef4444' : undefined,
                  }}
                >
                  {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '—'}
                </Typography>
              </Grid>
              {lead.assignee && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Asignado a</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {lead.assignee.first_name} {lead.assignee.last_name}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Notes */}
          {(lead.notes || lead.lostReason) && (
            <Paper sx={{ ...paperSx, mb: 3 }}>
              {lead.notes && (
                <>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Notas</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {lead.notes}
                  </Typography>
                </>
              )}
              {lead.lostReason && (
                <Box sx={{ mt: lead.notes ? 2 : 0 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={0.5} sx={{ color: '#ef4444' }}>
                    Razon de Perdida
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lead.lostReason}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* Activities Timeline */}
          <Paper sx={paperSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Actividades ({lead.activities?.length || 0})
              </Typography>
              {!isClosed && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setActivityDialogOpen(true)}
                  size="small"
                  sx={{ borderRadius: '10px', textTransform: 'none' }}
                >
                  Agregar
                </Button>
              )}
            </Box>

            {(!lead.activities || lead.activities.length === 0) ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                No hay actividades registradas
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {lead.activities.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fafafa',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f0'}`,
                      opacity: activity.completedAt ? 0.7 : 1,
                    }}
                  >
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: activity.completedAt
                        ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#ecfdf5')
                        : (isDarkMode ? 'rgba(236,72,153,0.15)' : '#fdf2f8'),
                      color: activity.completedAt ? '#10b981' : '#ec4899',
                      flexShrink: 0,
                    }}>
                      {ACTIVITY_ICONS[activity.activityType] || <NoteIcon sx={{ fontSize: 18 }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {ACTIVITY_LABELS[activity.activityType] || activity.activityType}
                        </Typography>
                        {!activity.completedAt && !isClosed && (
                          <Tooltip title="Marcar como completada">
                            <IconButton size="small" onClick={() => handleCompleteActivity(activity.id)} sx={{ color: '#10b981' }}>
                              <CompleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {activity.completedAt && (
                          <Chip label="Completada" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {activity.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.createdAt)}
                        </Typography>
                        {activity.creator && (
                          <Typography variant="caption" color="text.secondary">
                            por {activity.creator.first_name} {activity.creator.last_name}
                          </Typography>
                        )}
                        {activity.scheduledAt && (
                          <Typography variant="caption" sx={{ color: '#ec4899' }}>
                            Programada: {formatDate(activity.scheduledAt)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right - Pipeline Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...paperSx, position: { md: 'sticky' }, top: { md: 100 } }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Pipeline
            </Typography>

            {/* Status Steps */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {Object.entries(STATUS_LABELS).filter(([key]) => key !== 'lost').map(([key, label]) => {
                const isActive = key === lead.status;
                const isPast = Object.keys(STATUS_LABELS).indexOf(key) < Object.keys(STATUS_LABELS).indexOf(lead.status);
                const isLost = lead.status === 'lost';

                return (
                  <Box
                    key={key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      borderRadius: '10px',
                      bgcolor: isActive
                        ? (isDarkMode ? 'rgba(236,72,153,0.12)' : '#fdf2f8')
                        : 'transparent',
                      border: isActive ? `1px solid ${isDarkMode ? 'rgba(236,72,153,0.3)' : '#fbcfe8'}` : '1px solid transparent',
                    }}
                  >
                    <Box sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: isPast || isActive
                        ? (isLost ? '#ef4444' : '#ec4899')
                        : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'),
                      color: isPast || isActive ? '#fff' : 'text.secondary',
                    }}>
                      {isPast ? '✓' : Object.keys(STATUS_LABELS).indexOf(key) + 1}
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={isActive ? 700 : 400}
                      sx={{ color: isActive ? (isDarkMode ? '#fff' : '#111') : 'text.secondary' }}
                    >
                      {label}
                    </Typography>
                  </Box>
                );
              })}
              {lead.status === 'lost' && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: '10px',
                  bgcolor: isDarkMode ? 'rgba(239,68,68,0.12)' : '#fef2f2',
                  border: `1px solid ${isDarkMode ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
                }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
                    ✕
                  </Box>
                  <Typography variant="body2" fontWeight={700}>Perdido</Typography>
                </Box>
              )}
            </Box>

            {lead.convertedAt && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}` }}>
                  <Typography variant="caption" color="text.secondary" display="block">Convertido el</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatDate(lead.convertedAt)}</Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Cambiar Estado a "{STATUS_LABELS[selectedStatus] || selectedStatus}"
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {selectedStatus === 'lost'
              ? `¿Estas seguro de marcar el prospecto ${lead.leadCode} como perdido?`
              : `¿Avanzar el prospecto ${lead.leadCode} a "${STATUS_LABELS[selectedStatus]}"?`}
          </DialogContentText>
          {selectedStatus === 'lost' && (
            <TextField
              label="Razon de perdida *"
              multiline
              rows={3}
              fullWidth
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Explica por que se perdio este prospecto..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setStatusDialogOpen(false); setSelectedStatus(''); setLostReason(''); }}>Cancelar</Button>
          <Button
            onClick={handleChangeStatus}
            variant="contained"
            disabled={actionLoading || (selectedStatus === 'lost' && !lostReason.trim())}
            color={selectedStatus === 'lost' ? 'error' : 'primary'}
          >
            {actionLoading ? 'Cambiando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert to Customer Dialog */}
      <Dialog open={convertDialogOpen} onClose={() => setConvertDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Convertir a Cliente</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esto creara un nuevo cliente con los datos del prospecto.
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: isDarkMode ? 'rgba(0,117,255,0.05)' : '#f0f7ff', borderRadius: '12px' }}>
            <Typography variant="body2" fontWeight={600}>Datos del nuevo cliente:</Typography>
            <Typography variant="body2" color="text.secondary">Nombre: {lead.name}</Typography>
            {lead.company && <Typography variant="body2" color="text.secondary">Empresa: {lead.company}</Typography>}
            {lead.email && <Typography variant="body2" color="text.secondary">Email: {lead.email}</Typography>}
            {lead.phone && <Typography variant="body2" color="text.secondary">Telefono: {lead.phone}</Typography>}
          </Box>
          <FormControlLabel
            control={<Checkbox checked={createQuote} onChange={(e) => setCreateQuote(e.target.checked)} />}
            label="Crear cotizacion borrador automaticamente"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConvert}
            variant="contained"
            disabled={actionLoading}
            sx={{
              background: 'linear-gradient(90deg, #0075ff, #21d4fd)',
              '&:hover': { background: 'linear-gradient(90deg, #0060cc, #1ab8e0)' },
            }}
          >
            {actionLoading ? 'Convirtiendo...' : 'Convertir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={activityDialogOpen} onClose={() => setActivityDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Actividad</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo de Actividad</InputLabel>
              <Select label="Tipo de Actividad" value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                <MenuItem value="call">Llamada</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="meeting">Reunion</MenuItem>
                <MenuItem value="note">Nota</MenuItem>
                <MenuItem value="follow_up">Seguimiento</MenuItem>
                <MenuItem value="proposal">Propuesta</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Descripcion *"
              multiline
              rows={3}
              fullWidth
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              placeholder="Describe la actividad..."
            />
            <TextField
              label="Fecha Programada"
              type="datetime-local"
              size="small"
              fullWidth
              value={activityScheduledAt}
              onChange={(e) => setActivityScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleAddActivity}
            variant="contained"
            disabled={actionLoading || !activityDescription.trim()}
            sx={{
              background: 'linear-gradient(90deg, #ec4899, #f472b6)',
              '&:hover': { background: 'linear-gradient(90deg, #db2777, #ec4899)' },
            }}
          >
            {actionLoading ? 'Guardando...' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadDetail;
