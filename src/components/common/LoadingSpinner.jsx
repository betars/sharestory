import React from 'react';
import { Box, CircularProgress, Fade } from '@mui/material';

export default function LoadingSpinner({ size = 40, minHeight = 200 }) {
  return (
    <Fade in={true} style={{ transitionDelay: '100ms' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 4,
          minHeight
        }}
      >
        <CircularProgress size={size} />
      </Box>
    </Fade>
  );
} 