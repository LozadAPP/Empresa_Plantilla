/**
 * StyledCard - Tarjeta reutilizable con tema automático
 *
 * VISION UI STYLE - Glassmorphism + Neon Glow
 *
 * Uso:
 * <StyledCard>
 *   <Typography>Contenido</Typography>
 * </StyledCard>
 *
 * Props opcionales:
 * - hover: boolean - Añade efecto hover con glow neón
 * - padding: number - Padding personalizado (default: 3)
 * - glow: boolean - Añade efecto glow permanente visible
 * - glowColor: 'primary' | 'cyan' | 'purple' | 'success' - Color del glow
 */

import { Paper, PaperProps } from '@mui/material';
import { styled } from '@mui/material/styles';

type GlowColor = 'primary' | 'cyan' | 'purple' | 'success';

interface StyledCardProps extends PaperProps {
  hover?: boolean;
  padding?: number;
  glow?: boolean;
  glowColor?: GlowColor;
}

// OPTIMIZADO: Colores de glow reducidos
const glowColors: Record<GlowColor, { border: string; shadow: string }> = {
  primary: {
    border: 'rgba(0, 117, 255, 0.4)',
    shadow: '0 0 12px rgba(0, 117, 255, 0.2)',  // Reducido de 30px a 12px
  },
  cyan: {
    border: 'rgba(33, 212, 253, 0.4)',
    shadow: '0 0 12px rgba(33, 212, 253, 0.2)',
  },
  purple: {
    border: 'rgba(139, 92, 246, 0.4)',
    shadow: '0 0 12px rgba(139, 92, 246, 0.2)',
  },
  success: {
    border: 'rgba(1, 181, 116, 0.4)',
    shadow: '0 0 12px rgba(1, 181, 116, 0.2)',
  },
};

export const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) =>
    prop !== 'hover' && prop !== 'padding' && prop !== 'glow' && prop !== 'glowColor',
})<StyledCardProps>(({ theme, hover, padding = 3, glow, glowColor = 'primary' }) => ({
  padding: theme.spacing(padding),
  borderRadius: '20px',
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
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  }),

  // OPTIMIZADO: Efecto glow permanente (más sutil)
  ...(glow && theme.palette.mode === 'dark' && {
    border: `1.5px solid ${glowColors[glowColor].border}`,
    boxShadow: `0 4px 16px rgba(0, 0, 0, 0.3), ${glowColors[glowColor].shadow}`,
  }),

  // OPTIMIZADO: Hover effects simplificados
  ...(hover && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',  // Reducido de -4px a -2px
      ...(theme.palette.mode === 'dark' ? {
        border: '1.5px solid rgba(0, 117, 255, 0.4)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',  // Simplificado sin glow
      } : {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
        borderColor: 'rgba(0, 117, 255, 0.25)',
      }),
    },
  }),
}));

export default StyledCard;
