import React from 'react';
import { 
  Typography, 
  Breadcrumbs, 
  Link, 
  Box, 
  Button 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function PageHeader({ title, breadcrumbs, action }) {
  return (
    <Box sx={{ 
      mb: 4,
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', sm: 'center' },
      gap: 2
    }}>
      <Box>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((crumb, index) =>
            index < breadcrumbs.length - 1 ? (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.path}
                color="inherit"
                underline="hover"
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      </Box>

      {action && (
        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          {action}
        </Box>
      )}
    </Box>
  );
}