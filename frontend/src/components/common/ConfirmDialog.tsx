import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

export type ConfirmDialogSeverity = 'warning' | 'error' | 'info' | 'success';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  severity?: ConfirmDialogSeverity;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const severityConfig = {
  warning: {
    icon: WarningIcon,
    color: '#f59e0b'
  },
  error: {
    icon: ErrorIcon,
    color: '#ef4444'
  },
  info: {
    icon: InfoIcon,
    color: '#3b82f6'
  },
  success: {
    icon: SuccessIcon,
    color: '#10b981'
  }
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  severity = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'primary',
  loading = false,
  onConfirm,
  onCancel
}) => {
  const theme = useTheme();
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: theme.palette.mode === 'dark' ? '#1c1c2e' : '#ffffff'
        }
      }}
    >
      <DialogTitle component="div">
        <Box display="flex" alignItems="center" gap={1.5}>
          <Icon sx={{ color: config.color, fontSize: 28 }} />
          <Typography variant="h6" component="span" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            color: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(0, 0, 0, 0.7)',
            fontSize: '0.95rem',
            lineHeight: 1.6
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 100
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            minWidth: 100,
            position: 'relative'
          }}
        >
          {loading ? (
            <>
              <CircularProgress
                size={20}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: '-10px',
                  marginTop: '-10px'
                }}
              />
              <span style={{ opacity: 0 }}>{confirmText}</span>
            </>
          ) : (
            confirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
