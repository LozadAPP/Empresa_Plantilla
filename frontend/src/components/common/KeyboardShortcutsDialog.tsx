/**
 * Dialog que muestra los atajos de teclado disponibles.
 * Se abre con Ctrl+/ o desde el botón de ayuda.
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { SHORTCUT_DEFINITIONS } from '../../hooks/useKeyboardShortcuts';

interface Props {
  open: boolean;
  onClose: () => void;
}

const KeyboardShortcutsDialog: React.FC<Props> = ({ open, onClose }) => {
  const { isDarkMode } = useCustomTheme();

  const kbdSx = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: 1,
    py: 0.25,
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    fontFamily: 'monospace',
    bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
    color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
    minWidth: 28,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: isDarkMode ? '#1c1c2e' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Atajos de Teclado</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {SHORTCUT_DEFINITIONS.map((shortcut) => (
            <Box
              key={shortcut.keys}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.75,
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {shortcut.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {shortcut.keys.split(' + ').map((key) => (
                  <Box key={key} component="kbd" sx={kbdSx}>
                    {key}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
