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
  useTheme,
  useMediaQuery
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          bgcolor: theme.palette.mode === 'dark' ? '#1c1c2e' : '#ffffff',
          m: isMobile ? 0 : 2,
        }
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          pt: { xs: 3, sm: 2 },
          px: { xs: 2.5, sm: 3 }
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Icon sx={{ color: config.color, fontSize: { xs: 24, sm: 28 } }} />
          <Typography
            variant="h6"
            component="span"
            fontWeight={600}
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 } }}>
        <DialogContentText
          sx={{
            color: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(0, 0, 0, 0.7)',
            fontSize: { xs: '0.875rem', sm: '0.95rem' },
            lineHeight: 1.6
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          pb: { xs: 3, sm: 2.5 },
          gap: 1,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}
      >
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            minWidth: { xs: 'auto', sm: 100 },
            py: { xs: 1.25, sm: 1 },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          fullWidth={isMobile}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            minWidth: { xs: 'auto', sm: 100 },
            py: { xs: 1.25, sm: 1 },
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
