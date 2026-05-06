import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { format } from 'date-fns';

const NotificationCard = ({ notification, isRead, onMarkRead }) => {
  
  // Choose color based on type
  const getTypeColor = (type) => {
    switch (type) {
      case 'Placement': return 'success';
      case 'Result': return 'info';
      case 'Event': return 'warning';
      default: return 'default';
    }
  };

  const formattedDate = notification.Timestamp 
    ? format(new Date(notification.Timestamp), 'MMM dd, yyyy HH:mm')
    : 'Unknown date';

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderLeft: '6px solid',
        borderColor: `${getTypeColor(notification.Type)}.main`,
        backgroundColor: isRead ? '#fafafa' : '#fff',
        opacity: isRead ? 0.7 : 1,
        transition: '0.3s',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3
        }
      }}
      onClick={() => onMarkRead(notification.ID)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" gap={1} alignItems="center">
            <Chip 
              label={notification.Type} 
              size="small" 
              color={getTypeColor(notification.Type)} 
            />
            {!isRead && (
              <Chip label="NEW" size="small" color="error" variant="outlined" />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formattedDate}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ fontWeight: isRead ? 'normal' : 'bold' }}>
          {notification.Message}
        </Typography>
        {notification.score && (
          <Typography variant="caption" color="text.disabled" display="block" mt={1}>
            Priority Score: {notification.score.toFixed(2)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
