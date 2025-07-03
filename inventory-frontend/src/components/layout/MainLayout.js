import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import CustomAlert from '../common/Alert';  // Note: importing CustomAlert
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <CustomAlert />  {/* Using the correctly named component */}
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;