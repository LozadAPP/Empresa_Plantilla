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
import { Paper, Box, Typography, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

interface StyledKPIPaperProps {
  customColor?: string;
}

const KPIPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'customColor',
})<StyledKPIPaperProps>(({ theme }) => ({
  // RESPONSIVE: Padding escalable
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2.5),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
  },
  borderRadius: '16px',
  [theme.breakpoints.up('sm')]: {
    borderRadius: '20px',
  },
  display: 'flex',
  alignItems: 'center',
  // RESPONSIVE: Gap escalable
  gap: theme.spacing(1.5),
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(2.5),
  },
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',

  // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter para mejor FPS
  ...(theme.palette.mode === 'dark' ? {
    background: 'rgba(6, 11, 40, 0.95)',
    border: '1.5px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  } : {
    background: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  }),

  '&:hover': {
    transform: 'translateY(-2px)',
    ...(theme.palette.mode === 'dark' ? {
      border: '1.5px solid rgba(0, 117, 255, 0.35)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
    } : {
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    }),
  },
}));

const IconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'iconColor',
})<{ iconColor: string }>(({ theme, iconColor }) => ({
  // RESPONSIVE: Tamaño escalable
  width: 48,
  height: 48,
  borderRadius: '12px',
  [theme.breakpoints.up('sm')]: {
    width: 56,
    height: 56,
    borderRadius: '14px',
  },
  [theme.breakpoints.up('md')]: {
    width: 64,
    height: 64,
    borderRadius: '16px',
  },
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

  // OPTIMIZADO: glow simplificado
  ...(theme.palette.mode === 'dark' && {
    boxShadow: `0 0 12px ${iconColor}25`,
  }),

  // RESPONSIVE: Icono escalable
  '& > svg': {
    fontSize: 24,
    [theme.breakpoints.up('sm')]: {
      fontSize: 28,
    },
    [theme.breakpoints.up('md')]: {
      fontSize: 32,
    },
    color: iconColor,
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
  /** Índice para animación staggered (0, 1, 2...) */
  index?: number;
}

export const StyledKPI: React.FC<StyledKPIProps> = ({
  icon,
  label,
  value,
  subtitle,
  color,
  extra,
  index = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <KPIPaper
      elevation={0}
      sx={{
        '@keyframes kpiSlideIn': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        animation: `kpiSlideIn 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      <IconContainer iconColor={color}>
        {icon}
      </IconContainer>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            // RESPONSIVE: Label escalable
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
            fontWeight: 500,
            mb: { xs: 0.25, sm: 0.5 },
            // Truncar en móvil si es muy largo
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            // RESPONSIVE: Valor escalable
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
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
            sx={{
              // RESPONSIVE: Subtitle escalable
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
              display: { xs: isMobile ? 'none' : 'block', sm: 'block' }, // Ocultar en móvil muy pequeño
            }}
          >
            {subtitle}
          </Typography>
        )}
        {extra && <Box sx={{ mt: { xs: 0.25, sm: 0.5 } }}>{extra}</Box>}
      </Box>
    </KPIPaper>
  );
};

export default StyledKPI;
