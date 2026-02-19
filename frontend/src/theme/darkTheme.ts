import { createTheme } from '@mui/material/styles';

// ==============================================
// VISION UI STYLE - Dark Theme
// ==============================================
// Diseño inspirado en Vision UI Dashboard
// Glassmorphism dramático, gradientes cyan/azul,
// efectos de glow neón visibles
// ==============================================

// Colores Vision UI
const colors = {
  // Fondos
  bgMain: '#060b28',
  bgSecondary: '#0f1535',
  bgCard: 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)',
  bgCardSolid: 'rgba(6, 11, 40, 0.94)',

  // Acentos principales (Cyan/Azul)
  primary: '#0075ff',
  primaryLight: '#21d4fd',
  primaryDark: '#4318ff',

  // Secundario (Purple)
  secondary: '#a78bfa',
  secondaryLight: '#c4b5fd',
  secondaryDark: '#8b5cf6',

  // Estados
  success: '#01b574',
  successLight: '#c9fbd5',
  warning: '#ffb547',
  warningLight: '#fff5cc',
  error: '#ff5252',
  errorLight: '#ff8a80',
  info: '#0075ff',
  infoLight: '#21d4fd',

  // Texto
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',

  // Bordes y glows - OPTIMIZADO para rendimiento
  borderDefault: 'rgba(255, 255, 255, 0.15)',
  borderGlow: 'rgba(0, 117, 255, 0.4)',
  glowCyan: '0 0 12px rgba(33, 212, 253, 0.25)',  // Reducido de 25px/0.4 a 12px/0.25
  glowBlue: '0 0 12px rgba(0, 117, 255, 0.25)',   // Reducido de 25px/0.4 a 12px/0.25
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: '#ffffff',
    },
    background: {
      default: colors.bgMain,
      paper: colors.bgSecondary,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    success: {
      main: colors.success,
      light: colors.successLight,
      dark: '#059669',
      contrastText: '#ffffff',
    },
    error: {
      main: colors.error,
      light: colors.errorLight,
      dark: '#dc2626',
    },
    warning: {
      main: colors.warning,
      light: colors.warningLight,
      dark: '#d97706',
    },
    info: {
      main: colors.info,
      light: colors.infoLight,
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
    borderRadius: 16, // Estandarizado con lightTheme
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Fondo Vision UI - color sólido para mejor rendimiento
          backgroundColor: colors.bgMain,
          minHeight: '100vh',
        },
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
          padding: '10px 24px',
          // OPTIMIZADO: Solo transicionar propiedades necesarias
          transition: 'transform 0.2s ease, background 0.2s ease',
        },
        contained: {
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          boxShadow: '0 4px 12px rgba(0, 117, 255, 0.3)',  // Simplificado
          '&:hover': {
            background: `linear-gradient(90deg, ${colors.primaryLight} 0%, ${colors.primary} 100%)`,
            boxShadow: '0 6px 16px rgba(0, 117, 255, 0.35)',  // Simplificado
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: colors.borderGlow,
          borderWidth: '1.5px',
          '&:hover': {
            borderColor: colors.primaryLight,
            backgroundColor: 'rgba(0, 117, 255, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter para mejor rendimiento durante scroll
          background: 'rgba(6, 11, 40, 0.95)',
          // REMOVIDO: backdrop-filter causa lag severo durante scroll
          border: `1.5px solid ${colors.borderDefault}`,
          borderRadius: '20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            border: `1.5px solid ${colors.borderGlow}`,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter para mejor rendimiento
          background: 'rgba(6, 11, 40, 0.95)',
          // REMOVIDO: backdrop-filter causa lag severo durante scroll
          border: `1.5px solid ${colors.borderDefault}`,
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        },
        elevation2: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
        },
        elevation3: {
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '15px',
            // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter
            backgroundColor: 'rgba(6, 11, 40, 0.85)',
            transition: 'border-color 0.2s ease',
            '& fieldset': {
              borderColor: colors.borderDefault,
              borderWidth: '1.5px',
              transition: 'border-color 0.2s ease',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 117, 255, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary,
              boxShadow: '0 0 0 3px rgba(0, 117, 255, 0.15)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.borderDefault,
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 117, 255, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: colors.bgCard,
          // OPTIMIZADO: blur reducido de 120px a 20px
          backdropFilter: 'blur(20px)',
          border: `1.5px solid ${colors.borderDefault}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',  // Simplificado
          borderRadius: '15px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          // OPTIMIZADO: transition específica
          transition: 'background-color 0.15s ease',
          borderRadius: '8px',
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: 'rgba(0, 117, 255, 0.15)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 117, 255, 0.25)',
            '&:hover': {
              backgroundColor: 'rgba(0, 117, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter
          background: 'rgba(6, 11, 40, 0.98)',
          borderRight: `1px solid ${colors.borderDefault}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter
          background: 'rgba(6, 11, 40, 0.98)',
          borderBottom: `1px solid ${colors.borderDefault}`,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: colors.bgCard,
          // OPTIMIZADO: blur reducido de 120px a 20px
          backdropFilter: 'blur(20px)',
          border: `1.5px solid ${colors.borderDefault}`,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',  // Simplificado
          borderRadius: '20px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: colors.bgCardSolid,
          // OPTIMIZADO: blur reducido de 60px a 10px
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.borderDefault}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',  // Simplificado
          fontSize: '0.75rem',
          borderRadius: '10px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 117, 255, 0.2)',
          border: `1.5px solid rgba(0, 117, 255, 0.4)`,
          // OPTIMIZADO: transition específica
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 117, 255, 0.3)',
          },
        },
        colorSuccess: {
          backgroundColor: 'rgba(1, 181, 116, 0.2)',
          border: '1.5px solid rgba(1, 181, 116, 0.4)',
          '&:hover': {
            backgroundColor: 'rgba(1, 181, 116, 0.3)',
          },
        },
        colorError: {
          backgroundColor: 'rgba(227, 26, 26, 0.2)',
          border: '1.5px solid rgba(227, 26, 26, 0.4)',
          '&:hover': {
            backgroundColor: 'rgba(227, 26, 26, 0.3)',
          },
        },
        colorWarning: {
          backgroundColor: 'rgba(255, 181, 71, 0.2)',
          border: '1.5px solid rgba(255, 181, 71, 0.4)',
          '&:hover': {
            backgroundColor: 'rgba(255, 181, 71, 0.3)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          transition: 'box-shadow 0.15s ease',
        },
        head: {
          backgroundColor: 'rgba(0, 117, 255, 0.08)',
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 117, 255, 0.08)',
          },
          '&:not(.MuiTableRow-head):hover': {
            '& .MuiTableCell-root:first-of-type': {
              boxShadow: 'inset 3px 0 0 0 #0075ff',
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          height: 3,
          borderRadius: '3px 3px 0 0',
          // OPTIMIZADO: removido glow
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          // OPTIMIZADO: transition específica
          transition: 'color 0.15s ease',
          '&.Mui-selected': {
            color: colors.primaryLight,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        },
        switchBase: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              opacity: 1,
            },
            // OPTIMIZADO: removido glow en thumb
          },
        },
        thumb: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',  // Simplificado
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          // OPTIMIZADO: transition específica
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 117, 255, 0.15)',
            // OPTIMIZADO: removido glow
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          height: 8,
        },
        bar: {
          borderRadius: 8,
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          // OPTIMIZADO: removido glow
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colors.primaryLight,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          // OPTIMIZADO AGRESIVO: Removido backdrop-filter
          border: '1.5px solid',
          borderRadius: '15px',
        },
        standardSuccess: {
          backgroundColor: 'rgba(1, 181, 116, 0.15)',
          borderColor: 'rgba(1, 181, 116, 0.4)',
          // OPTIMIZADO: removido glow
        },
        standardError: {
          backgroundColor: 'rgba(227, 26, 26, 0.15)',
          borderColor: 'rgba(227, 26, 26, 0.4)',
          // OPTIMIZADO: removido glow
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 181, 71, 0.15)',
          borderColor: 'rgba(255, 181, 71, 0.4)',
          // OPTIMIZADO: removido glow
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 117, 255, 0.15)',
          borderColor: 'rgba(0, 117, 255, 0.4)',
          // OPTIMIZADO: removido glow
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          // OPTIMIZADO: removido glow
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '15px',
          margin: '2px 8px',
          // OPTIMIZADO: transition específica
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 117, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 117, 255, 0.2)',
            borderLeft: `3px solid ${colors.primaryLight}`,
            // OPTIMIZADO: removido glow
            '&:hover': {
              backgroundColor: 'rgba(0, 117, 255, 0.25)',
            },
          },
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `2px solid rgba(0, 117, 255, 0.3)`,
          // OPTIMIZADO: removido glow
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: colors.primary,
        },
        thumb: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',  // Simplificado
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 117, 255, 0.3)',  // Simplificado
          },
        },
        track: {
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          // OPTIMIZADO: removido glow
        },
        rail: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        },
      },
    },
  },
});

export default darkTheme;
