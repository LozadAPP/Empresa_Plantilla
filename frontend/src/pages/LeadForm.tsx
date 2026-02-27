/**
 * Formulario de Prospecto (Crear/Editar)
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import leadService from '../services/leadService';
import { userService } from '../services/userService';

interface UserOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const LeadForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [notes, setNotes] = useState('');

  // Data state
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load assignable users (vendedores + jefes de ventas)
  useEffect(() => {
    const loadData = async () => {
      try {
        const usersRes = await userService.getUsers({ isActive: true });
        if (usersRes.success) {
          setUsers(usersRes.data || []);
        }
      } catch (error) {
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Load existing lead for editing
  useEffect(() => {
    if (isEditing && id) {
      const loadLead = async () => {
        setLoading(true);
        try {
          const response = await leadService.getById(Number(id));
          if (response.success) {
            const l = response.data;
            setName(l.name || '');
            setCompany(l.company || '');
            setEmail(l.email || '');
            setPhone(l.phone || '');
            setSource(l.source || 'other');
            setPriority(l.priority || 'medium');
            setEstimatedValue(Number(l.estimatedValue) || 0);
            setAssignedTo(l.assignedTo || null);
            setNextFollowUp(l.nextFollowUp ? new Date(l.nextFollowUp).toISOString().split('T')[0] : '');
            setNotes(l.notes || '');
          }
        } catch (error) {
          enqueueSnackbar('Error al cargar prospecto', { variant: 'error' });
          navigate('/leads');
        } finally {
          setLoading(false);
        }
      };
      loadLead();
    }
  }, [id, isEditing, navigate, enqueueSnackbar]);

  const handleSave = async () => {
    if (!name.trim()) {
      enqueueSnackbar('El nombre del prospecto es requerido', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        source: source as any,
        priority: priority as any,
        estimatedValue: estimatedValue || undefined,
        assignedTo: assignedTo || undefined,
        nextFollowUp: nextFollowUp || undefined,
        notes: notes.trim() || undefined,
      };

      let response;
      if (isEditing) {
        response = await leadService.update(Number(id), data);
      } else {
        response = await leadService.create(data);
      }

      if (response.success) {
        enqueueSnackbar(
          isEditing ? 'Prospecto actualizado' : 'Prospecto creado exitosamente',
          { variant: 'success' }
        );
        navigate(`/leads/${response.data?.id || ''}`);
      }
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Error al guardar prospecto',
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
  };

  const paperSx = {
    p: 3,
    borderRadius: '16px',
    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
  };

  const selectedUser = users.find((u) => u.id === assignedTo) || null;

  if (loading || loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ color: 'text.secondary', textTransform: 'none' }}
        >
          Volver
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
          {isEditing ? 'Editar Prospecto' : 'Nuevo Prospecto'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left column - Form */}
        <Grid item xs={12} md={8}>
          {/* Contact Info */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Informacion de Contacto
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre *"
                  size="small"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del prospecto"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Empresa"
                  size="small"
                  fullWidth
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  size="small"
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefono"
                  size="small"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Business Info */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Informacion del Negocio
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Fuente</InputLabel>
                  <Select label="Fuente" value={source} onChange={(e) => setSource(e.target.value)}>
                    <MenuItem value="web">Web</MenuItem>
                    <MenuItem value="referral">Referido</MenuItem>
                    <MenuItem value="cold_call">Llamada en Frio</MenuItem>
                    <MenuItem value="event">Evento</MenuItem>
                    <MenuItem value="social_media">Redes Sociales</MenuItem>
                    <MenuItem value="other">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select label="Prioridad" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Valor Estimado"
                  type="number"
                  size="small"
                  fullWidth
                  value={estimatedValue || ''}
                  onChange={(e) => setEstimatedValue(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={users}
                  value={selectedUser}
                  onChange={(_, val) => setAssignedTo(val?.id || null)}
                  getOptionLabel={(opt) => `${opt.first_name} ${opt.last_name}`}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {opt.first_name} {opt.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{opt.email}</Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Asignar a" placeholder="Buscar vendedor..." />
                  )}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Proximo Seguimiento"
                  type="date"
                  size="small"
                  fullWidth
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Notas
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Notas adicionales sobre el prospecto..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
            />
          </Paper>
        </Grid>

        {/* Right column - Summary & Actions */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              ...paperSx,
              position: { md: 'sticky' },
              top: { md: 100 },
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Resumen
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                <Typography variant="body2" fontWeight={600}>{name || '—'}</Typography>
              </Box>
              {company && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Empresa:</Typography>
                  <Typography variant="body2">{company}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Fuente:</Typography>
                <Typography variant="body2">{source}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Prioridad:</Typography>
                <Typography variant="body2">{priority}</Typography>
              </Box>
              {estimatedValue > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Valor Estimado:</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#0075ff' }}>
                    ${estimatedValue.toLocaleString('es-MX')}
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || !name.trim()}
              fullWidth
              sx={{
                background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { background: 'linear-gradient(90deg, #db2777 0%, #ec4899 100%)' },
              }}
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Prospecto'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LeadForm;
