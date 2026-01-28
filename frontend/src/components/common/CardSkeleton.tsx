import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

interface CardSkeletonProps {
  count?: number;
  height?: number;
  showIcon?: boolean;
}

export const StatCardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 4,
  height = 120,
  showIcon = true
}) => {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="40%" height={40} />
                </Box>
                {showIcon && (
                  <Skeleton variant="circular" width={40} height={40} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export const AlertCardSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ borderLeft: '4px solid', borderLeftColor: 'grey.300' }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Skeleton variant="text" width="30%" height={28} />
                  <Skeleton variant="circular" width={8} height={8} />
                </Box>
                <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="rounded" width={100} height={24} />
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="rounded" width={120} height={24} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 250 }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width="40%" height={28} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1 }} />
      </CardContent>
    </Card>
  );
};

export const TableRowSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            gap: 2,
            py: 2,
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Box key={colIndex} sx={{ flex: 1 }}>
              <Skeleton
                variant="text"
                width={`${60 + Math.random() * 30}%`}
                height={24}
                animation="wave"
              />
            </Box>
          ))}
        </Box>
      ))}
    </>
  );
};

export default {
  StatCardSkeleton,
  AlertCardSkeleton,
  ChartSkeleton,
  TableRowSkeleton
};
