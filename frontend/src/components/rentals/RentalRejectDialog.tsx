/**
 * Diálogo para rechazar una renta pendiente de aprobación
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box
} from '@mui/material';
import { Cancel as RejectIcon } from '@mui/icons-material';

interface RentalRejectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  rentalCode: string;
  loading?: boolean;
}

const RentalRejectDialog: React.FC<RentalRejectDialogProps> = ({
  open,
  onClose,
  onConfirm,
  rentalCode,
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Validar razón
    if (!reason.trim()) {
      setError('La razón del rechazo es requerida');
      return;
    }
    if (reason.trim().length < 10) {
      setError('La razón debe tener al menos 10 caracteres');
      return;
    }
    if (reason.trim().length > 500) {
      setError('La razón no puede exceder 500 caracteres');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RejectIcon color="error" />
        <Typography variant="h6">
          Rechazar Renta {rentalCode}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Por favor proporciona una razón para el rechazo. Esta información será visible
            para el vendedor que creó la renta.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Razón del rechazo"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            error={!!error}
            helperText={error || `${reason.length}/500 caracteres (mínimo 10)`}
            placeholder="Ej: El cliente no cumple con los requisitos de crédito..."
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading || reason.trim().length < 10}
          startIcon={<RejectIcon />}
        >
          {loading ? 'Procesando...' : 'Confirmar Rechazo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RentalRejectDialog;
