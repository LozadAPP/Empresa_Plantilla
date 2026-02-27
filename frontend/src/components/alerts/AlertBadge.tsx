import React, { useState } from 'react';
import {
  Badge,
  IconButton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationDrawer from '../notifications/NotificationDrawer';

const AlertBadge: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <IconButton
        onClick={() => setDrawerOpen(true)}
        sx={{ color: 'inherit' }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              minWidth: 18,
              height: 18
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};

export default AlertBadge;
