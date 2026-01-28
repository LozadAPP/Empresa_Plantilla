/**
 * Componente InvoiceDownload - Descarga de facturas (CHAT 2) - MEJORADO
 * Cambios: Dialog de confirmacion en lugar de confirm(), mejor manejo de errores
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import invoiceService from '../../services/invoiceService';

interface InvoiceDownloadProps {
  invoiceId: number;
  invoiceCode?: string;
  pdfUrl?: string;
  variant?: 'icon' | 'button';
  showEmail?: boolean;
  customerEmail?: string;
}

const InvoiceDownload: React.FC<InvoiceDownloadProps> = ({
  invoiceId,
  invoiceCode,
  pdfUrl,
  variant = 'button',
  showEmail = true,
  customerEmail
}) => {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleDownload = async () => {
    if (pdfUrl) {
      // Si ya tenemos la URL del PDF, abrir en nueva pestaña
      window.open(pdfUrl, '_blank');
      return;
    }

    // Si no, intentar generar el PDF
    setDownloading(true);
    try {
      const blob = await invoiceService.downloadPDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceCode || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Factura descargada exitosamente',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error descargando factura:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al descargar la factura',
        severity: 'error'
      });
    } finally {
      setDownloading(false);
    }
  };

  // Abrir dialog de confirmacion
  const handleOpenConfirmDialog = useCallback(() => {
    setConfirmDialogOpen(true);
  }, []);

  // Cerrar dialog de confirmacion
  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialogOpen(false);
  }, []);

  // Enviar email despues de confirmar
  const handleSendEmail = useCallback(async () => {
    setConfirmDialogOpen(false);
    setSending(true);
    try {
      await invoiceService.resend(invoiceId);
      setSnackbar({
        open: true,
        message: 'Factura enviada exitosamente por email',
        severity: 'success'
      });
    } catch (error: unknown) {
      console.error('Error enviando factura:', error);
      const message = error instanceof Error ? error.message : 'Error al enviar la factura';
      setSnackbar({
        open: true,
        message,
        severity: 'error'
      });
    } finally {
      setSending(false);
    }
  }, [invoiceId]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (variant === 'icon') {
    return (
      <>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Descargar PDF">
            <IconButton
              size="small"
              onClick={handleDownload}
              disabled={downloading}
              color="primary"
            >
              {downloading ? (
                <CircularProgress size={20} />
              ) : (
                <PdfIcon />
              )}
            </IconButton>
          </Tooltip>

          {showEmail && customerEmail && (
            <Tooltip title="Enviar por email">
              <IconButton
                size="small"
                onClick={handleOpenConfirmDialog}
                disabled={sending}
                color="success"
              >
                {sending ? (
                  <CircularProgress size={20} />
                ) : (
                  <EmailIcon />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={downloading}
          size="small"
        >
          {downloading ? 'Descargando...' : 'Descargar PDF'}
        </Button>

        {showEmail && customerEmail && (
          <Button
            variant="outlined"
            startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
            onClick={handleOpenConfirmDialog}
            disabled={sending}
            size="small"
            color="success"
          >
            {sending ? 'Enviando...' : 'Enviar por Email'}
          </Button>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog de confirmacion */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-send-dialog-title"
        aria-describedby="confirm-send-dialog-description"
      >
        <DialogTitle id="confirm-send-dialog-title">
          Confirmar envio de factura
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-send-dialog-description">
            ¿Desea enviar la factura por email a {customerEmail}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSendEmail} color="primary" variant="contained" autoFocus>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoiceDownload;
