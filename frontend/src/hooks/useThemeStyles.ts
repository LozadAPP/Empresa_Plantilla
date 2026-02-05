import { useMemo } from 'react';
import { alpha } from '@mui/material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

// ==============================================
// VISION UI STYLE - Theme Styles Hook
// ==============================================
// Variables de estilo dramáticas con gradientes
// cyan/azul, glows visibles y efectos neón
// ==============================================

export const useThemeStyles = () => {
  const { isDarkMode } = useCustomTheme();

  // OPTIMIZADO: isDarkMode incluido dentro del useMemo para evitar spread
  // y crear nueva referencia en cada llamada
  const styles = useMemo(() => ({
    // Incluir isDarkMode dentro del objeto memoizado
    isDarkMode,
    // ==========================================
    // TEXT COLORS
    // ==========================================
    text: {
      primary: isDarkMode ? '#ffffff' : '#1f2937',
      secondary: isDarkMode ? '#a0aec0' : '#6b7280',
      muted: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)',
      body: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
      heading: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
      headingStrong: isDarkMode ? '#ffffff' : '#111827',
    },

    // ==========================================
    // BACKGROUND COLORS (Vision UI)
    // ==========================================
    background: {
      // Base backgrounds
      page: isDarkMode ? '#060b28' : '#f8fafc',
      pageGradient: isDarkMode
        ? 'linear-gradient(127.09deg, #060b28 19.41%, #0f1535 76.65%)'
        : '#f8fafc',
      card: isDarkMode
        ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        : '#ffffff',
      cardSolid: isDarkMode ? 'rgba(6, 11, 40, 0.94)' : '#ffffff',
      cardHover: isDarkMode ? 'rgba(15, 21, 53, 0.95)' : '#f8fafc',

      // Interactive backgrounds
      hover: isDarkMode ? 'rgba(0, 117, 255, 0.15)' : alpha('#0075ff', 0.06),
      active: isDarkMode ? 'rgba(0, 117, 255, 0.25)' : alpha('#0075ff', 0.1),
      subtle: isDarkMode ? 'rgba(0, 117, 255, 0.08)' : alpha('#0075ff', 0.03),

      // Grid and patterns
      grid: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',

      // Sidebar
      sidebar: isDarkMode
        ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        : '#ffffff',
    },

    // ==========================================
    // BORDER COLORS
    // ==========================================
    border: {
      default: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
      subtle: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      hover: isDarkMode ? 'rgba(0, 117, 255, 0.4)' : 'rgba(0, 117, 255, 0.2)',
      active: isDarkMode ? 'rgba(0, 117, 255, 0.6)' : 'rgba(0, 117, 255, 0.4)',
      primary: isDarkMode ? 'rgba(0, 117, 255, 0.5)' : 'rgba(0, 117, 255, 0.3)',
      glow: isDarkMode ? '1.5px solid rgba(0, 117, 255, 0.5)' : '1px solid rgba(0, 117, 255, 0.3)',
      glowCyan: isDarkMode ? '1.5px solid rgba(33, 212, 253, 0.5)' : '1px solid rgba(33, 212, 253, 0.3)',
    },

    // ==========================================
    // GLASSMORPHISM EFFECTS - OPTIMIZADO
    // ==========================================
    glass: {
      background: isDarkMode
        ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        : 'rgba(255, 255, 255, 0.8)',
      backgroundSolid: isDarkMode ? 'rgba(6, 11, 40, 0.94)' : 'rgba(255, 255, 255, 0.95)',
      backgroundHover: isDarkMode ? 'rgba(15, 21, 53, 0.95)' : 'rgba(255, 255, 255, 0.9)',
      // OPTIMIZADO: blur reducido de 120px/60px a 20px/15px
      blur: 'blur(20px)',
      blurLight: 'blur(15px)',
      border: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
      borderHover: isDarkMode ? 'rgba(0, 117, 255, 0.4)' : 'rgba(0, 117, 255, 0.3)',
    },

    // ==========================================
    // GLOW EFFECTS - OPTIMIZADO para rendimiento
    // ==========================================
    glow: {
      // Main glows - OPTIMIZADO (reducido de 25px/40px a 12px/18px)
      primary: isDarkMode
        ? '0 0 12px rgba(0, 117, 255, 0.25)'
        : '0 0 8px rgba(0, 117, 255, 0.15)',
      primaryStrong: isDarkMode
        ? '0 0 18px rgba(0, 117, 255, 0.35)'
        : '0 0 12px rgba(0, 117, 255, 0.2)',
      cyan: isDarkMode
        ? '0 0 12px rgba(33, 212, 253, 0.25)'
        : '0 0 8px rgba(33, 212, 253, 0.15)',
      cyanStrong: isDarkMode
        ? '0 0 18px rgba(33, 212, 253, 0.35)'
        : '0 0 12px rgba(33, 212, 253, 0.2)',
      purple: isDarkMode
        ? '0 0 12px rgba(139, 92, 246, 0.25)'
        : '0 0 8px rgba(139, 92, 246, 0.15)',

      // Status glows - OPTIMIZADO
      success: isDarkMode
        ? '0 0 12px rgba(1, 181, 116, 0.25)'
        : '0 0 8px rgba(1, 181, 116, 0.15)',
      error: isDarkMode
        ? '0 0 12px rgba(227, 26, 26, 0.25)'
        : '0 0 8px rgba(227, 26, 26, 0.15)',
      warning: isDarkMode
        ? '0 0 12px rgba(255, 181, 71, 0.25)'
        : '0 0 8px rgba(255, 181, 71, 0.15)',
      info: isDarkMode
        ? '0 0 12px rgba(0, 117, 255, 0.25)'
        : '0 0 8px rgba(0, 117, 255, 0.15)',
    },

    // ==========================================
    // GRADIENT EFFECTS (Vision UI Style)
    // ==========================================
    gradient: {
      // Main page gradient
      main: isDarkMode
        ? 'linear-gradient(127.09deg, #060b28 19.41%, #0f1535 76.65%)'
        : 'none',

      // Card gradient
      card: isDarkMode
        ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        : 'none',

      // Sidebar gradient
      sidebar: isDarkMode
        ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        : 'none',

      // Primary gradients (Cyan/Blue)
      primary: 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)',
      primaryReverse: 'linear-gradient(90deg, #21d4fd 0%, #0075ff 100%)',

      // Secondary gradient (Purple)
      secondary: 'linear-gradient(90deg, #4318ff 0%, #9f7aea 100%)',

      // Status gradients
      success: 'linear-gradient(90deg, #01b574 0%, #c9fbd5 100%)',
      warning: isDarkMode ? 'linear-gradient(90deg, #ffb547 0%, #fff5cc 100%)' : 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
      error: isDarkMode ? 'linear-gradient(90deg, #ff5252 0%, #ff8a80 100%)' : 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',

      // Border gradients for neon effect
      borderPrimary: 'linear-gradient(90deg, rgba(0, 117, 255, 0.6), rgba(33, 212, 253, 0.6))',
      borderCyan: 'linear-gradient(90deg, rgba(33, 212, 253, 0.6), rgba(0, 117, 255, 0.6))',
      borderPurple: 'linear-gradient(90deg, rgba(67, 24, 255, 0.6), rgba(159, 122, 234, 0.6))',
    },

    // ==========================================
    // SHADOW EFFECTS - OPTIMIZADO
    // ==========================================
    shadow: {
      // OPTIMIZADO: shadows simplificados sin glows adicionales
      card: isDarkMode
        ? '0 4px 16px rgba(0, 0, 0, 0.3)'
        : '0 2px 12px rgba(0, 0, 0, 0.06)',
      cardHover: isDarkMode
        ? '0 8px 24px rgba(0, 0, 0, 0.4)'
        : '0 4px 16px rgba(0, 0, 0, 0.1)',
      elevated: isDarkMode
        ? '0 8px 28px rgba(0, 0, 0, 0.4)'
        : '0 6px 20px rgba(0, 0, 0, 0.1)',
      dropdown: isDarkMode
        ? '0 8px 24px rgba(0, 0, 0, 0.4)'
        : '0 4px 16px rgba(0, 0, 0, 0.1)',
      // Glow shadows - OPTIMIZADO
      glowBlue: isDarkMode
        ? '0 0 12px rgba(0, 117, 255, 0.25)'
        : '0 0 8px rgba(0, 117, 255, 0.1)',
      glowCyan: isDarkMode
        ? '0 0 12px rgba(33, 212, 253, 0.25)'
        : '0 0 8px rgba(33, 212, 253, 0.1)',
    },

    // ==========================================
    // PRIMARY ACCENT (Cyan/Blue - Vision UI)
    // ==========================================
    primary: {
      main: '#0075ff',
      light: '#21d4fd',
      dark: '#4318ff',
      background: isDarkMode ? 'rgba(0, 117, 255, 0.15)' : 'rgba(0, 117, 255, 0.08)',
      backgroundHover: isDarkMode ? 'rgba(0, 117, 255, 0.25)' : 'rgba(0, 117, 255, 0.12)',
      backgroundStrong: isDarkMode ? 'rgba(0, 117, 255, 0.3)' : 'rgba(0, 117, 255, 0.15)',
      border: isDarkMode ? 'rgba(0, 117, 255, 0.5)' : 'rgba(0, 117, 255, 0.3)',
      gradient: 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)',
    },

    // ==========================================
    // SECONDARY ACCENT (Purple)
    // ==========================================
    purple: {
      main: '#a78bfa',
      light: '#c4b5fd',
      dark: '#8b5cf6',
      background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)',
      backgroundHover: isDarkMode ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.12)',
      backgroundStrong: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.15)',
      border: isDarkMode ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)',
      gradient: 'linear-gradient(90deg, #4318ff 0%, #9f7aea 100%)',
    },

    // ==========================================
    // STATUS COLORS
    // ==========================================
    status: {
      success: {
        main: '#01b574',
        light: '#c9fbd5',
        background: isDarkMode ? 'rgba(1, 181, 116, 0.15)' : alpha('#01b574', 0.08),
        backgroundLight: isDarkMode ? 'rgba(1, 181, 116, 0.08)' : alpha('#01b574', 0.04),
        border: isDarkMode ? 'rgba(1, 181, 116, 0.4)' : 'rgba(1, 181, 116, 0.3)',
        gradient: 'linear-gradient(90deg, #01b574 0%, #c9fbd5 100%)',
      },
      error: {
        main: isDarkMode ? '#ff5252' : '#dc2626',
        light: isDarkMode ? '#ff8a80' : '#ef4444',
        background: isDarkMode ? 'rgba(255, 82, 82, 0.15)' : alpha('#dc2626', 0.08),
        backgroundLight: isDarkMode ? 'rgba(255, 82, 82, 0.08)' : alpha('#dc2626', 0.04),
        border: isDarkMode ? 'rgba(255, 82, 82, 0.4)' : 'rgba(220, 38, 38, 0.3)',
        gradient: isDarkMode ? 'linear-gradient(90deg, #ff5252 0%, #ff8a80 100%)' : 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
      },
      warning: {
        main: isDarkMode ? '#ffb547' : '#b45309',
        light: isDarkMode ? '#fff5cc' : '#d97706',
        background: isDarkMode ? 'rgba(255, 181, 71, 0.15)' : alpha('#b45309', 0.08),
        backgroundLight: isDarkMode ? 'rgba(255, 181, 71, 0.08)' : alpha('#b45309', 0.04),
        border: isDarkMode ? 'rgba(255, 181, 71, 0.4)' : 'rgba(180, 83, 9, 0.3)',
        gradient: isDarkMode ? 'linear-gradient(90deg, #ffb547 0%, #fff5cc 100%)' : 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
      },
      info: {
        main: '#0075ff',
        light: '#21d4fd',
        background: isDarkMode ? 'rgba(0, 117, 255, 0.15)' : alpha('#0075ff', 0.08),
        backgroundLight: isDarkMode ? 'rgba(0, 117, 255, 0.08)' : alpha('#0075ff', 0.04),
        border: isDarkMode ? 'rgba(0, 117, 255, 0.4)' : 'rgba(0, 117, 255, 0.3)',
        gradient: 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)',
      },
    },

    // ==========================================
    // CHART TOOLTIP - OPTIMIZADO
    // ==========================================
    tooltip: {
      backgroundColor: isDarkMode ? 'rgba(6, 11, 40, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      titleColor: isDarkMode ? '#ffffff' : '#1f2937',
      bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
      borderColor: isDarkMode ? 'rgba(0, 117, 255, 0.3)' : 'rgba(0, 117, 255, 0.15)',
      // OPTIMIZADO: shadow simplificado sin glow
      boxShadow: isDarkMode
        ? '0 4px 16px rgba(0, 0, 0, 0.4)'
        : '0 4px 12px rgba(0, 0, 0, 0.08)',
    },

    // ==========================================
    // CHART SCALES
    // ==========================================
    chart: {
      gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      tickColor: isDarkMode ? '#a0aec0' : '#6b7280',
      labelColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)',
      lineColor: isDarkMode ? 'rgba(0, 117, 255, 0.8)' : 'rgba(0, 117, 255, 0.7)',
      // Gradient for chart lines
      lineGradient: isDarkMode
        ? ['rgba(0, 117, 255, 0.8)', 'rgba(33, 212, 253, 0.8)']
        : ['rgba(0, 117, 255, 0.7)', 'rgba(33, 212, 253, 0.7)'],
    },

    // ==========================================
    // TRANSITIONS - OPTIMIZADO (propiedades específicas)
    // ==========================================
    transition: {
      fast: 'background-color 0.15s ease, color 0.15s ease',
      normal: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
      smooth: 'transform 0.25s ease, opacity 0.25s ease',
      spring: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    // ==========================================
    // RESPONSIVE UTILITIES
    // ==========================================
    // Utilidades para usar con sx prop de Material-UI
    responsive: {
      // Display utilities
      hideOnMobile: { display: { xs: 'none', sm: 'block' } },
      showOnMobile: { display: { xs: 'block', sm: 'none' } },
      hideOnTablet: { display: { xs: 'block', md: 'none' } },
      showOnTablet: { display: { xs: 'none', md: 'block' } },

      // Flex direction utilities
      stackOnMobile: { flexDirection: { xs: 'column', sm: 'row' } },
      stackOnTablet: { flexDirection: { xs: 'column', md: 'row' } },

      // Width utilities
      fullWidthOnMobile: { width: { xs: '100%', sm: 'auto' } },
      fullWidthOnTablet: { width: { xs: '100%', md: 'auto' } },

      // Touch-friendly targets (mínimo 44px para accesibilidad)
      touchTarget: { minHeight: { xs: 48, sm: 40 }, minWidth: { xs: 48, sm: 'auto' } },

      // Padding responsive
      pagePadding: { p: { xs: 2, sm: 3, md: 4 } },
      cardPadding: { p: { xs: 2, sm: 2.5, md: 3 } },
      sectionPadding: { px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } },

      // Gap responsive
      gapSm: { gap: { xs: 1, sm: 1.5, md: 2 } },
      gapMd: { gap: { xs: 1.5, sm: 2, md: 3 } },
      gapLg: { gap: { xs: 2, sm: 3, md: 4 } },

      // Grid templates comunes
      gridKpi: {
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        }
      },
      gridCards: {
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)'
        }
      },

      // Typography responsive
      textHeading: { fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } },
      textSubheading: { fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } },
      textBody: { fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' } },
      textSmall: { fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } },
    },

  }), [isDarkMode]);

  // OPTIMIZADO: Devolver styles directamente (isDarkMode ya está incluido)
  return styles;
};

export default useThemeStyles;
