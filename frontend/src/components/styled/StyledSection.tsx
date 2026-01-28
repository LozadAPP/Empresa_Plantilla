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
            justifyContent: 'space-between',
            alignItems: action ? 'center' : 'flex-start',
            mb: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
      )}
      {children}
    </StyledCard>
  );
};

export default StyledSection;
