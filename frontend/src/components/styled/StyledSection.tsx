/**
 * StyledSection - Sección reutilizable con título y subtítulo
 *
 * Uso:
 * <StyledSection
 *   title="Desempeño del Negocio"
 *   subtitle="Ingresos y ocupación en el tiempo"
 *   action={<Button>Ver más</Button>}
 * >
 *   <Chart />
 * </StyledSection>
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import StyledCard from './StyledCard';

export interface StyledSectionProps {
  /** Título de la sección */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Acción opcional (botón, tabs, etc.) */
  action?: React.ReactNode;
  /** Contenido de la sección */
  children: React.ReactNode;
  /** Padding personalizado (default: 3) */
  padding?: number;
  /** Margen inferior personalizado */
  marginBottom?: number;
}

export const StyledSection: React.FC<StyledSectionProps> = ({
  title,
  subtitle,
  action,
  children,
  padding = 3,
  marginBottom,
}) => {
  return (
    <StyledCard padding={padding} sx={{ mb: marginBottom }}>
      {(title || subtitle || action) && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: action ? 'center' : 'flex-start' },
            mb: { xs: 1.5, sm: 2 },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && (
            <Box sx={{
              width: { xs: '100%', sm: 'auto' },
              '& > *': {
                width: { xs: '100%', sm: 'auto' },
              }
            }}>
              {action}
            </Box>
          )}
        </Box>
      )}
      {children}
    </StyledCard>
  );
};

export default StyledSection;
