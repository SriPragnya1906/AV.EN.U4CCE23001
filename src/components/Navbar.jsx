import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import NotificationsIcon from '@mui/material/Icon'; // fallback
import StarIcon from '@mui/icons-material/Star';
import ListIcon from '@mui/icons-material/List';

const Navbar = () => {
  const location = useLocation();

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          AffordMed Notifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/"
            startIcon={<ListIcon />}
            sx={{ opacity: location.pathname === '/' ? 1 : 0.7 }}
          >
            All
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/priority"
            startIcon={<StarIcon />}
            sx={{ opacity: location.pathname === '/priority' ? 1 : 0.7 }}
          >
            Priority Inbox
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
