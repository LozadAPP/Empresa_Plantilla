import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactElement;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => {
  const { isDarkMode } = useCustomTheme();

  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 96,
          height: 96,
          borderRadius: '50%',
          mb: 2,
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(0, 117, 255, 0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 117, 255, 0.04) 0%, transparent 70%)',
          border: isDarkMode
            ? '1px dashed rgba(255, 255, 255, 0.1)'
            : '1px dashed rgba(0, 0, 0, 0.08)',
        }}
      >
        {React.cloneElement(icon, {
          sx: { fontSize: 48, color: 'text.secondary', ...icon.props.sx },
        })}
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default EmptyState;
