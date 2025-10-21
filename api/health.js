const { createModuleServerlessHandler } = require('../lib/serverless-handler');
const { createModuleLogger } = require('../lib/logger');

// Create module logger
const moduleLogger = createModuleLogger('health');

/**
 * GET /health
 * Health check endpoint
 */
async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}

// Export Vercel serverless function
module.exports = createModuleServerlessHandler(handleHealth, 'health');
