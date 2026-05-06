import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Pagination, CircularProgress } from '@mui/material';
import NotificationCard from '../components/NotificationCard';
import { fetchNotifications, markAsViewed, isViewed } from '../utils/api';

const AllNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [viewedState, setViewedState] = useState({});

  const limit = 5; // small limit to show pagination

  useEffect(() => {
    loadNotifications();
  }, [page, typeFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications({ 
        page, 
        limit, 
        notification_type: typeFilter 
      });
      setNotifications(data);
      
      // Update viewed state
      const vState = {};
      data.forEach(n => {
        vState[n.ID] = isViewed(n.ID);
      });
      setViewedState(vState);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = (id) => {
    markAsViewed(id);
    setViewedState(prev => ({ ...prev, [id]: true }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          All Notifications
        </Typography>
        
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={typeFilter}
            label="Filter by Type"
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1); // reset page on filter change
            }}
          >
            <MenuItem value=""><em>All Types</em></MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {notifications.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" py={5}>
              No notifications found.
            </Typography>
          ) : (
            notifications.map((notif) => (
              <NotificationCard 
                key={notif.ID} 
                notification={notif} 
                isRead={viewedState[notif.ID]}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
          
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination 
              count={3} // Hardcoded total pages for demo since API doesn't return total
              page={page} 
              onChange={(e, val) => setPage(val)} 
              color="primary" 
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default AllNotifications;
