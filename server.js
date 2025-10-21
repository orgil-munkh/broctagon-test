require('dotenv').config();
const express = require('express');
const handlePayUrl = require('./routes/pay-url');
const handlePayCallback = require('./routes/pay-callback-simple');
const { createModuleLogger, generateRequestId, sanitizeData } = require('./lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Create server logger
const logger = createModuleLogger('server');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const requestId = generateRequestId();
  req.requestId = requestId;
  
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    headers: sanitizeData(req.headers),
    query: sanitizeData(req.query)
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.post('/api/pay/url', handlePayUrl);
app.post('/api/pay/callback', handlePayCallback);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    sandboxMode: process.env.PSP_SANDBOX_MODE === 'true'
  });
  
  console.log(`🚀 Broctagon CRM Integration Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment URL: http://localhost:${PORT}/api/pay/url`);
  console.log(`🔔 Webhook callback: http://localhost:${PORT}/api/pay/callback`);
  console.log(`🔧 Sandbox mode: ${process.env.PSP_SANDBOX_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
});

module.exports = app;
