const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const logger = require('../logging_middleware/logger');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(logger);

// Endpoint to fetch notifications from the AffordMed evaluation service
app.get('/notifications', async (req, res) => {
  try {
    const apiUrl = 'http://20.207.122.201/evaluation-service/notifications';
    const url = new URL(apiUrl);
    // Forward query params (page, limit, notification_type)
    Object.entries(req.query).forEach(([key, value]) => url.searchParams.append(key, value));

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.AFFORDMED_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Backend fetch error:', response.status, err);
      return res.status(response.status).json({ error: 'Failed to fetch notifications' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Notification backend listening on port ${PORT}`);
});
