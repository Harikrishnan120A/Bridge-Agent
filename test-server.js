// Test script to run the server standalone (without VS Code)
const express = require('express');
const app = express();
const port = 3737;

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    name: 'AI Bridge Agent',
    version: '1.0.0',
    status: 'running',
    message: 'Welcome to AI Bridge Agent!',
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      action: '/api/action (POST)'
    },
    documentation: 'See AI-ASSISTANT-PROMPT.md for usage instructions'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'AI Bridge Server is running!'
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    serverRunning: true,
    port: port,
    sessionActive: false
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ AI Bridge Test Server running at http://localhost:${port}`);
  console.log(`Test it: http://localhost:${port}/api/health`);
  console.log('Press Ctrl+C to stop');
});
