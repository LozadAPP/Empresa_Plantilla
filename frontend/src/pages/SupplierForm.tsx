/**
 * Formulario de Crear/Editar Proveedor
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Business as SuppliersIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { supplierService } from '../services/supplierService';
import { SupplierType } from '../types/supplier';

interface FormData {
  name: string;
  rfc: string;
  supplier_type: SupplierType;
  category: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  bank_name: string;
  bank_account: string;
  clabe: string;
  payment_terms: number;
  credit_limit: number;
  rating?: number;
  notes: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  rfc: '',
  supplier_type: 'services',
  category: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'México',
  zip_code: '',
  bank_name: '',
  bank_account: '',
  clabe: '',
  payment_terms: 0,
  credit_limit: 0,
  rating: undefined,
  notes: '',
};

const CATEGORIES = [
  'Mantenimiento vehicular',
  'Combustible',
  'Seguros',
  'Refacciones',
  'Limpieza',
  'Papelería',
  'Tecnología',
  'Servicios profesionales',
  'Servicios públicos',
  'Otro',
];

const SupplierForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isEditing = Boolean(id);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const cardBg = isDarkMode ? '#1c1c2e' : '#ffffff';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textSecondary = isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      supplierService.getById(Number(id))
        .then((res) => {
          const s = res.data;
          setFormData({
            name: s.name || '',
            rfc: s.rfc || '',
            supplier_type: s.supplier_type || 'services',
            category: s.category || '',
            contact_person: s.contact_person || '',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            country: s.country || 'México',
            zip_code: s.zip_code || '',
            bank_name: s.bank_name || '',
            bank_account: s.bank_account || '',
            clabe: s.clabe || '',
            payment_terms: s.payment_terms || 0,
            credit_limit: s.credit_limit || 0,
            rating: s.rating || undefined,
            notes: s.notes || '',
          });
        })
        .catch(() => {
          enqueueSnackbar('Error al cargar proveedor', { variant: 'error' });
          navigate('/suppliers');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, navigate, enqueueSnackbar]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      enqueueSnackbar('El nombre es requerido', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await supplierService.update(Number(id), formData);
        enqueueSnackbar('Proveedor actualizado exitosamente', { variant: 'success' });
      } else {
        await supplierService.create(formData);
        enqueueSnackbar('Proveedor creado exitosamente', { variant: 'success' });
      }
      navigate('/suppliers');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, mt: 1, color: '#3b82f6' }}>
      {children}
    </Typography>
  );

  return (
    <Box sx={{ p: isMobile ? 2 : 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/suppliers')}
          sx={{ borderRadius: 2 }}
        >
          Volver
        </Button>
        <SuppliersIcon sx={{ fontSize: 28, color: '#3b82f6' }} />
        <Typography variant="h5" fontWeight={700}>
          {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
        {/* Section 1: General Info */}
        <SectionTitle>Información General</SectionTitle>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre del Proveedor *"
              fullWidth
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="RFC"
              fullWidth
              value={formData.rfc}
              onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
              inputProps={{ maxLength: 13 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Proveedor</InputLabel>
              <Select
                value={formData.supplier_type}
                label="Tipo de Proveedor"
                onChange={(e) => handleChange('supplier_type', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="services">Servicios</MenuItem>
                <MenuItem value="products">Productos</MenuItem>
                <MenuItem value="both">Ambos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.category}
                label="Categoría"
                onChange={(e) => handleChange('category', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">Sin categoría</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Section 2: Contact */}
        <SectionTitle>Contacto</SectionTitle>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Persona de Contacto"
              fullWidth
              value={formData.contact_person}
              onChange={(e) => handleChange('contact_person', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Teléfono"
              fullWidth
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Dirección"
              fullWidth
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Ciudad"
              fullWidth
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Estado"
              fullWidth
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="País"
              fullWidth
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="C.P."
              fullWidth
              value={formData.zip_code}
              onChange={(e) => handleChange('zip_code', e.target.value)}
              inputProps={{ maxLength: 5 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>

        {/* Section 3: Banking */}
        <SectionTitle>Datos Bancarios</SectionTitle>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Banco"
              fullWidth
              value={formData.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Cuenta Bancaria"
              fullWidth
              value={formData.bank_account}
              onChange={(e) => handleChange('bank_account', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="CLABE Interbancaria"
              fullWidth
              value={formData.clabe}
              onChange={(e) => handleChange('clabe', e.target.value)}
              inputProps={{ maxLength: 18 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>

        {/* Section 4: Commercial Terms */}
        <SectionTitle>Condiciones Comerciales</SectionTitle>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Días de Crédito"
              type="number"
              fullWidth
              value={formData.payment_terms}
              onChange={(e) => handleChange('payment_terms', parseInt(e.target.value) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">días</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Límite de Crédito"
              type="number"
              fullWidth
              value={formData.credit_limit}
              onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, color: textSecondary }}>Calificación</Typography>
              <Rating
                value={formData.rating}
                onChange={(_, val) => handleChange('rating', val)}
                size="large"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Section 5: Notes */}
        <SectionTitle>Notas</SectionTitle>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Notas adicionales sobre el proveedor..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/suppliers')}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            }}
          >
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Proveedor')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SupplierForm;
