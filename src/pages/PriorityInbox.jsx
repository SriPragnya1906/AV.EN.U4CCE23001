import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import NotificationCard from '../components/NotificationCard';
import { fetchNotifications, markAsViewed, isViewed } from '../utils/api';
import { getTopN } from '../utils/prioritySort';

const PriorityInbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nValue, setNValue] = useState(10);
  const [viewedState, setViewedState] = useState({});

  useEffect(() => {
    loadPriorityNotifications();
  }, [nValue]);

  const loadPriorityNotifications = async () => {
    setLoading(true);
    try {
      // Fetch a larger set to sort from
      const data = await fetchNotifications({ page: 1, limit: 50 });
      
      // Calculate scores and get top N
      const topN = getTopN(data, nValue);
      setNotifications(topN);
      
      const vState = {};
      topN.forEach(n => {
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
        <Typography variant="h4" component="h1" color="primary">
          Priority Inbox
        </Typography>
        
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel>Show Top</InputLabel>
          <Select
            value={nValue}
            label="Show Top"
            onChange={(e) => setNValue(e.target.value)}
          >
            <MenuItem value={5}>Top 5</MenuItem>
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={15}>Top 15</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
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
              No priority notifications found.
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
        </>
      )}
    </Container>
  );
};

export default PriorityInbox;
