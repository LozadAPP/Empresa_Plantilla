import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface FPSCounterProps {
  isDarkMode?: boolean;
}

const FPSCounter: React.FC<FPSCounterProps> = ({ isDarkMode = true }) => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationId = useRef<number>();

  useEffect(() => {
    const updateFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime.current;

      // Update FPS every 500ms for smoother display
      if (elapsed >= 500) {
        const currentFps = Math.round((frameCount.current / elapsed) * 1000);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationId.current = requestAnimationFrame(updateFPS);
    };

    animationId.current = requestAnimationFrame(updateFPS);

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, []);

  // Color based on FPS
  const getColor = () => {
    if (fps >= 55) return '#10b981'; // Green - Good
    if (fps >= 30) return '#f59e0b'; // Orange - Acceptable
    return '#ef4444'; // Red - Poor
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 1400, // Por encima de modals (1300) pero no excesivo
        px: 1.5,
        py: 0.5,
        borderRadius: '8px',
        bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        border: `1px solid ${getColor()}`,
        boxShadow: `0 0 8px ${getColor()}40`,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'monospace',
          color: getColor(),
          lineHeight: 1,
        }}
      >
        {fps}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.6rem',
          fontWeight: 500,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
          lineHeight: 1,
        }}
      >
        FPS
      </Typography>
    </Box>
  );
};

export default FPSCounter;
