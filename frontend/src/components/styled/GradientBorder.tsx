/**
 * GradientBorder - Componente para bordes con gradiente neón
 *
 * VISION UI STYLE - Neon Border Effect
 *
 * Uso:
 * <GradientBorder gradient="primary">
 *   <Box p={3}>Contenido con borde neón</Box>
 * </GradientBorder>
 *
 * Props:
 * - gradient: 'primary' | 'cyan' | 'purple' | 'success' | 'warning' | 'error'
 * - glowIntensity: 'low' | 'medium' | 'high'
 * - borderRadius: number (default: 20)
 * - borderWidth: number (default: 1.5)
 */

import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

type GradientType = 'primary' | 'cyan' | 'purple' | 'success' | 'warning' | 'error';
type GlowIntensity = 'low' | 'medium' | 'high';

interface GradientBorderProps extends Omit<BoxProps, 'ref'> {
  children: React.ReactNode;
  gradient?: GradientType;
  glowIntensity?: GlowIntensity;
  borderRadius?: number;
  borderWidth?: number;
}

// Gradientes disponibles
const gradients: Record<GradientType, string> = {
  primary: 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)',
  cyan: 'linear-gradient(90deg, #21d4fd 0%, #0075ff 100%)',
  purple: 'linear-gradient(90deg, #4318ff 0%, #9f7aea 100%)',
  success: 'linear-gradient(90deg, #01b574 0%, #38ef7d 100%)',
  warning: 'linear-gradient(90deg, #ffb547 0%, #ffd700 100%)',
  error: 'linear-gradient(90deg, #e31a1a 0%, #ff6b6b 100%)',
};

// Colores de glow por tipo
const glowColors: Record<GradientType, string> = {
  primary: 'rgba(0, 117, 255, ',
  cyan: 'rgba(33, 212, 253, ',
  purple: 'rgba(139, 92, 246, ',
  success: 'rgba(1, 181, 116, ',
  warning: 'rgba(255, 181, 71, ',
  error: 'rgba(227, 26, 26, ',
};

// Intensidades de glow - OPTIMIZADO (valores más bajos)
const glowIntensities: Record<GlowIntensity, { blur: number; opacity: number }> = {
  low: { blur: 4, opacity: 0.15 },
  medium: { blur: 8, opacity: 0.2 },
  high: { blur: 12, opacity: 0.25 },
};

export const GradientBorder: React.FC<GradientBorderProps> = ({
  children,
  gradient = 'primary',
  glowIntensity = 'medium',
  borderRadius = 20,
  borderWidth = 1.5,
  sx,
  ...props
}) => {
  const { isDarkMode } = useCustomTheme();

  const selectedGradient = gradients[gradient];
  const glowColorBase = glowColors[gradient];
  const intensity = glowIntensities[glowIntensity];

  // OPTIMIZADO: Usar box-shadow en lugar de pseudo-elemento con blur
  const glowShadow = isDarkMode
    ? `0 0 ${intensity.blur}px ${glowColorBase}${intensity.opacity})`
    : 'none';

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: `${borderRadius}px`,
        padding: `${borderWidth}px`,
        background: isDarkMode ? selectedGradient : 'transparent',
        border: isDarkMode ? 'none' : `${borderWidth}px solid rgba(0, 0, 0, 0.1)`,
        // OPTIMIZADO: box-shadow simple en lugar de pseudo-elemento con blur
        boxShadow: glowShadow,
        ...sx,
      }}
      {...props}
    >
      <Box
        sx={{
          // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter
          background: isDarkMode
            ? 'rgba(6, 11, 40, 0.95)'
            : '#ffffff',
          borderRadius: `${borderRadius - borderWidth}px`,
          height: '100%',
          width: '100%',
          // REMOVIDO: backdropFilter causa lag durante scroll
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

/**
 * GradientBorderCard - Variante con padding incluido
 */
export const GradientBorderCard: React.FC<GradientBorderProps & { padding?: number }> = ({
  children,
  padding = 3,
  ...props
}) => {
  return (
    <GradientBorder {...props}>
      <Box sx={{ p: padding }}>
        {children}
      </Box>
    </GradientBorder>
  );
};

export default GradientBorder;
