import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  sx?: SxProps<Theme>;
}

/**
 * TabPanel component for use with MUI Tabs
 * Renders children only when the tab is active
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, sx }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ py: 3, ...sx }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default TabPanel;
