import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8b5cf6', // Purple
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa', // Gris más suave
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937', // Negro más suave
      secondary: '#6b7280',
    },
    divider: '#e5e7eb',
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    warning: {
      main: '#b45309',
      light: '#d97706',
      dark: '#92400e',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
  },
  typography: {
    fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    // RESPONSIVE: clamp(min, preferred, max) para escalado fluido
    h1: {
      fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', // 28px - 40px
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', // 24px - 32px
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
    },
    h3: {
      fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', // 20px - 28px
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)', // 18px - 24px
      fontWeight: 700,
      lineHeight: 1.35,
    },
    h5: {
      fontSize: 'clamp(1rem, 2vw, 1.25rem)', // 16px - 20px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)', // 15px - 18px
      fontWeight: 600,
      lineHeight: 1.45,
    },
    body1: {
      fontSize: 'clamp(0.8125rem, 1.2vw, 0.875rem)', // 13px - 14px
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 'clamp(0.75rem, 1vw, 0.8rem)', // 12px - 12.8px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', // 11px - 12px
      fontWeight: 400,
      lineHeight: 1.4,
    },
    button: {
      fontSize: 'clamp(0.8125rem, 1.2vw, 0.875rem)', // 13px - 14px
      fontWeight: 600,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          fontWeight: 600,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(139, 92, 246, 0.06)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            borderColor: '#d1d5db',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: '#d1d5db',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8b5cf6',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        filled: {
          backgroundColor: '#f3f4f6',
          '&:hover': {
            backgroundColor: '#e5e7eb',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.15s ease',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 117, 255, 0.04)',
          },
          '&:not(.MuiTableRow-head):hover': {
            '& .MuiTableCell-root:first-of-type': {
              boxShadow: 'inset 3px 0 0 0 #8b5cf6',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease, color 0.2s ease',
          '&:hover': {
            backgroundColor: '#f3f4f6',
          },
        },
      },
    },
  },
});

export default lightTheme;
