/**
 * StyledKPI - Componente de KPI reutilizable
 *
 * VISION UI STYLE - Glassmorphism + Glow Pronunciado
 *
 * Uso:
 * <StyledKPI
 *   icon={<TrendingUpIcon />}
 *   label="Ocupación de Flota"
 *   value="68%"
 *   subtitle="Meta: 75%"
 *   color="#01b574"
 * />
 */

import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

interface StyledKPIPaperProps {
  customColor?: string;
}

const KPIPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'customColor',
})<StyledKPIPaperProps>(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',

  // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter para mejor FPS
  ...(theme.palette.mode === 'dark' ? {
    background: 'rgba(6, 11, 40, 0.95)',
    // REMOVIDO: backdropFilter causa lag durante scroll
    border: '1.5px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  } : {
    background: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  }),

  '&:hover': {
    transform: 'translateY(-2px)',  // Reducido de -4px a -2px
    ...(theme.palette.mode === 'dark' ? {
      border: '1.5px solid rgba(0, 117, 255, 0.35)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',  // Simplificado sin glow
    } : {
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    }),
  },
}));

const IconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'iconColor',
})<{ iconColor: string }>(({ theme, iconColor }) => ({
  width: 64,
  height: 64,
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',

  // Background con gradiente
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${iconColor}25, ${iconColor}40)`
    : `linear-gradient(135deg, ${iconColor}15, ${iconColor}25)`,

  // Border visible
  border: `2px solid ${iconColor}50`,

  // OPTIMIZADO: glow simplificado (un solo shadow más pequeño)
  ...(theme.palette.mode === 'dark' && {
    boxShadow: `0 0 12px ${iconColor}25`,
  }),

  '& > svg': {
    fontSize: 32,
    color: iconColor,
    // OPTIMIZADO: drop-shadow simple (de doble a simple, valores reducidos)
    filter: theme.palette.mode === 'dark'
      ? `drop-shadow(0 0 6px ${iconColor}50)`
      : `drop-shadow(0 0 3px ${iconColor}30)`,
  },
}));

export interface StyledKPIProps {
  /** Icono del KPI (Material-UI Icon) */
  icon: React.ReactElement;
  /** Etiqueta del KPI (ej: "Ocupación de Flota") */
  label: string;
  /** Valor principal del KPI (ej: "68%", "145") */
  value: string | number;
  /** Subtítulo opcional (ej: "Meta: 75%") */
  subtitle?: string;
  /** Color del icono y valor (hex color) */
  color: string;
  /** Elemento adicional (ej: chip con tendencia) */
  extra?: React.ReactNode;
}

export const StyledKPI: React.FC<StyledKPIProps> = ({
  icon,
  label,
  value,
  subtitle,
  color,
  extra,
}) => {
  const theme = useTheme();

  return (
    <KPIPaper elevation={0}>
      <IconContainer iconColor={color}>
        {icon}
      </IconContainer>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.2,
            color: color,
            letterSpacing: '-0.02em',
            // OPTIMIZADO: Text glow reducido
            textShadow: theme.palette.mode === 'dark'
              ? `0 0 8px ${color}30`
              : 'none',
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            {subtitle}
          </Typography>
        )}
        {extra && <Box sx={{ mt: 0.5 }}>{extra}</Box>}
      </Box>
    </KPIPaper>
  );
};

export default StyledKPI;
