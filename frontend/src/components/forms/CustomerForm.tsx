import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { CustomerFormData, CustomerType, Customer } from '../../types';

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  loading?: boolean;
  editMode?: boolean;
  initialData?: Customer;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  editMode = false,
  initialData
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'México',
    tax_id: '',
    customer_type: 'individual',
    credit_limit: 0,
    payment_terms: 30,
    discount_percentage: 0,
    notes: '',
    rfc: '',
    regimen_fiscal: '',
    cfdi_email: '',
    zip_code: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data when in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      setFormData({
        name: initialData.name,
        contact_person: initialData.contact_person || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        country: initialData.country || 'México',
        tax_id: initialData.tax_id || '',
        customer_type: initialData.customer_type,
        credit_limit: initialData.credit_limit,
        payment_terms: initialData.payment_terms,
        discount_percentage: initialData.discount_percentage,
        notes: initialData.notes || '',
        rfc: initialData.rfc || '',
        regimen_fiscal: initialData.regimen_fiscal || '',
        cfdi_email: initialData.cfdi_email || '',
        zip_code: initialData.zip_code || ''
      });
    }
  }, [editMode, initialData, open]);

  const handleChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name?.trim()) newErrors.name = 'Nombre/Razón Social es requerido';

    // Email validation (optional but must be valid if provided)
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    // Phone validation (basic)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Teléfono debe tener al menos 10 dígitos';
    }

    // Tax ID validation (RFC format for Mexico - basic)
    if (formData.tax_id) {
      // Individual: 13 chars, Corporate: 12 chars
      if (formData.customer_type === 'individual' && formData.tax_id.length !== 13) {
        newErrors.tax_id = 'RFC de persona física debe tener 13 caracteres';
      } else if (formData.customer_type === 'corporate' && formData.tax_id.length !== 12) {
        newErrors.tax_id = 'RFC de persona moral debe tener 12 caracteres';
      }
    }

    // Number validations
    if (formData.credit_limit !== undefined && formData.credit_limit < 0) {
      newErrors.credit_limit = 'Límite de crédito no puede ser negativo';
    }

    if (formData.payment_terms !== undefined && formData.payment_terms < 0) {
      newErrors.payment_terms = 'Términos de pago no pueden ser negativos';
    }

    if (formData.discount_percentage !== undefined) {
      if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
        newErrors.discount_percentage = 'Descuento debe estar entre 0 y 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!editMode) {
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'México',
        tax_id: '',
        customer_type: 'individual',
        credit_limit: 0,
        payment_terms: 30,
        discount_percentage: 0,
        notes: '',
        rfc: '',
        regimen_fiscal: '',
        cfdi_email: '',
        zip_code: ''
      });
    }
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      data-testid="customer-form-dialog"
      PaperProps={{
        sx: {
          borderRadius: '16px'
        }
      }}
    >
      <DialogTitle component="div">
        <Typography variant="h6" component="span" fontWeight={600}>
          {editMode ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Tipo de Cliente */}
            <Grid item xs={12}>
              <FormControl fullWidth data-testid="customer-type-control">
                <InputLabel>Tipo de Cliente *</InputLabel>
                <Select
                  value={formData.customer_type}
                  label="Tipo de Cliente *"
                  onChange={(e) => handleChange('customer_type', e.target.value as CustomerType)}
                  data-testid="customer-type-select"
                  inputProps={{ 'data-testid': 'customer-type-field' }}
                >
                  <MenuItem value="individual" data-testid="type-individual">Individual / Persona Física</MenuItem>
                  <MenuItem value="corporate" data-testid="type-corporate">Empresarial / Persona Moral</MenuItem>
                  <MenuItem value="government" data-testid="type-government">Gobierno</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom sx={{ mt: 1 }}>
                Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} sm={formData.customer_type === 'individual' ? 12 : 6}>
              <TextField
                fullWidth
                label={formData.customer_type === 'individual' ? 'Nombre Completo *' : 'Razón Social *'}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                placeholder={formData.customer_type === 'individual' ? 'Ej: Juan Pérez García' : 'Ej: Transportes ABC S.A. de C.V.'}
                data-testid="customer-name-input"
                inputProps={{ 'data-testid': 'customer-name-field' }}
              />
            </Grid>

            {formData.customer_type !== 'individual' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Persona de Contacto"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="Ej: María González"
                  data-testid="customer-contact-input"
                  inputProps={{ 'data-testid': 'customer-contact-field' }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="ejemplo@correo.com"
                data-testid="customer-email-input"
                inputProps={{ 'data-testid': 'customer-email-field' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="5512345678"
                inputProps={{ maxLength: 15, 'data-testid': 'customer-phone-field' }}
                data-testid="customer-phone-input"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RFC / Tax ID"
                value={formData.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value.toUpperCase())}
                error={!!errors.tax_id}
                helperText={errors.tax_id || (formData.customer_type === 'individual' ? '13 caracteres' : '12 caracteres')}
                placeholder={formData.customer_type === 'individual' ? 'ABCD850101ABC' : 'ABC850101XYZ'}
                inputProps={{ maxLength: 13, 'data-testid': 'customer-taxid-field' }}
                data-testid="customer-taxid-input"
              />
            </Grid>

            {/* Dirección */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom sx={{ mt: 2 }}>
                Dirección
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Calle, Número, Colonia"
                data-testid="customer-address-input"
                inputProps={{ 'data-testid': 'customer-address-field' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ej: Querétaro"
                data-testid="customer-city-input"
                inputProps={{ 'data-testid': 'customer-city-field' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="País"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Ej: México"
                data-testid="customer-country-input"
                inputProps={{ 'data-testid': 'customer-country-field' }}
              />
            </Grid>

            {/* Datos Fiscales (CFDI) */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom sx={{ mt: 2 }}>
                Datos Fiscales (CFDI)
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RFC"
                value={formData.rfc || ''}
                onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
                placeholder={formData.customer_type === 'individual' ? 'ABCD850101ABC' : 'ABC850101XYZ'}
                helperText={formData.customer_type === 'individual' ? '13 caracteres (persona física)' : '12 caracteres (persona moral)'}
                inputProps={{ maxLength: 13 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Régimen Fiscal</InputLabel>
                <Select
                  value={formData.regimen_fiscal || ''}
                  label="Régimen Fiscal"
                  onChange={(e) => handleChange('regimen_fiscal', e.target.value)}
                >
                  <MenuItem value="">Sin especificar</MenuItem>
                  <MenuItem value="601">601 - General de Ley PM</MenuItem>
                  <MenuItem value="603">603 - PM Fines no Lucrativos</MenuItem>
                  <MenuItem value="612">612 - PF Actividades Empresariales</MenuItem>
                  <MenuItem value="616">616 - Sin obligaciones fiscales</MenuItem>
                  <MenuItem value="625">625 - Plataformas Tecnológicas</MenuItem>
                  <MenuItem value="626">626 - RESICO</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email CFDI"
                type="email"
                value={formData.cfdi_email || ''}
                onChange={(e) => handleChange('cfdi_email', e.target.value)}
                placeholder="facturacion@ejemplo.com"
                helperText="Email para recepción de facturas electrónicas"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código Postal"
                value={formData.zip_code || ''}
                onChange={(e) => handleChange('zip_code', e.target.value.replace(/\D/g, ''))}
                placeholder="76000"
                helperText="C.P. del domicilio fiscal (5 dígitos)"
                inputProps={{ maxLength: 5 }}
              />
            </Grid>

            {/* Información Financiera */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom sx={{ mt: 2 }}>
                Información Financiera
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Límite de Crédito"
                value={formData.credit_limit}
                onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value))}
                error={!!errors.credit_limit}
                helperText={errors.credit_limit}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                inputProps={{ min: 0, step: 0.01, 'data-testid': 'customer-credit-limit-field' }}
                data-testid="customer-credit-limit-input"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Términos de Pago (días)"
                value={formData.payment_terms}
                onChange={(e) => handleChange('payment_terms', parseInt(e.target.value))}
                error={!!errors.payment_terms}
                helperText={errors.payment_terms}
                InputProps={{
                  endAdornment: <InputAdornment position="end">días</InputAdornment>
                }}
                inputProps={{ min: 0, 'data-testid': 'customer-payment-terms-field' }}
                data-testid="customer-payment-terms-input"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Descuento (%)"
                value={formData.discount_percentage}
                onChange={(e) => handleChange('discount_percentage', parseFloat(e.target.value))}
                error={!!errors.discount_percentage}
                helperText={errors.discount_percentage}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                inputProps={{ min: 0, max: 100, step: 0.1, 'data-testid': 'customer-discount-field' }}
                data-testid="customer-discount-input"
              />
            </Grid>

            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas / Observaciones"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Cualquier información adicional sobre el cliente..."
                data-testid="customer-notes-input"
                inputProps={{ 'data-testid': 'customer-notes-field' }}
              />
            </Grid>
          </Grid>

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 3 }}>
              Por favor corrige los errores antes de continuar
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 500 }}
          data-testid="customer-cancel-button"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
          data-testid="customer-submit-button"
        >
          {loading ? 'Guardando...' : editMode ? 'Guardar Cambios' : 'Agregar Cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerForm;
