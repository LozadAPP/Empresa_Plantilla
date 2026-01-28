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
      muted: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
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
      warning: 'linear-gradient(90deg, #ffb547 0%, #fff5cc 100%)',
      error: 'linear-gradient(90deg, #e31a1a 0%, #ffd6d6 100%)',

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
        main: '#e31a1a',
        light: '#ffd6d6',
        background: isDarkMode ? 'rgba(227, 26, 26, 0.15)' : alpha('#e31a1a', 0.08),
        backgroundLight: isDarkMode ? 'rgba(227, 26, 26, 0.08)' : alpha('#e31a1a', 0.04),
        border: isDarkMode ? 'rgba(227, 26, 26, 0.4)' : 'rgba(227, 26, 26, 0.3)',
        gradient: 'linear-gradient(90deg, #e31a1a 0%, #ffd6d6 100%)',
      },
      warning: {
        main: '#ffb547',
        light: '#fff5cc',
        background: isDarkMode ? 'rgba(255, 181, 71, 0.15)' : alpha('#ffb547', 0.08),
        backgroundLight: isDarkMode ? 'rgba(255, 181, 71, 0.08)' : alpha('#ffb547', 0.04),
        border: isDarkMode ? 'rgba(255, 181, 71, 0.4)' : 'rgba(255, 181, 71, 0.3)',
        gradient: 'linear-gradient(90deg, #ffb547 0%, #fff5cc 100%)',
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

  }), [isDarkMode]);

  // OPTIMIZADO: Devolver styles directamente (isDarkMode ya está incluido)
  return styles;
};

export default useThemeStyles;
