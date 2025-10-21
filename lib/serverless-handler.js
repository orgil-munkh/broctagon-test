const { logger, generateRequestId, sanitizeData, createTimer } = require('./logger');

/**
 * Wraps Express route handlers for Vercel serverless functions
 * @param {Function} handler - Express route handler function
 * @returns {Function} Vercel serverless function handler
 */
function createServerlessHandler(handler) {
  return async (req, res) => {
    const requestId = generateRequestId();
    const timer = createTimer();
    
    // Add request ID to headers for tracing
    res.setHeader('X-Request-ID', requestId);
    
    // Add CORS headers for production
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, crm-pay-token, x-coinsbuy-signature');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Log incoming request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      headers: sanitizeData(req.headers),
      body: sanitizeData(req.body),
      query: sanitizeData(req.query)
    });
    
    try {
      // Create Express-like request/response objects
      const expressReq = {
        ...req,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params || {}
      };
      
      const expressRes = {
        ...res,
        status: (code) => {
          res.statusCode = code;
          return expressRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end: (data) => {
          res.end(data);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        }
      };
      
      // Call the original handler
      await handler(expressReq, expressRes);
      
      // Log successful response
      const duration = timer.end();
      logger.info('Request completed successfully', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
      
    } catch (error) {
      // Log error
      const duration = timer.end();
      logger.error('Request failed', {
        requestId,
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      // Send error response
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          requestId
        });
      }
    }
  };
}

/**
 * Creates a serverless handler with module-specific logging
 * @param {Function} handler - Express route handler function
 * @param {string} moduleName - Module name for logging
 * @returns {Function} Vercel serverless function handler
 */
function createModuleServerlessHandler(handler, moduleName) {
  const moduleLogger = logger.child({ module: moduleName });
  
  return async (req, res) => {
    const requestId = generateRequestId();
    const timer = createTimer();
    
    // Add request ID to headers for tracing
    res.setHeader('X-Request-ID', requestId);
    
    // Add CORS headers for production
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, crm-pay-token, x-coinsbuy-signature');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Log incoming request
    moduleLogger.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      headers: sanitizeData(req.headers),
      body: sanitizeData(req.body),
      query: sanitizeData(req.query)
    });
    
    try {
      // Create Express-like request/response objects
      const expressReq = {
        ...req,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params || {}
      };
      
      const expressRes = {
        ...res,
        status: (code) => {
          res.statusCode = code;
          return expressRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end: (data) => {
          res.end(data);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        }
      };
      
      // Call the original handler
      await handler(expressReq, expressRes);
      
      // Log successful response
      const duration = timer.end();
      moduleLogger.info('Request completed successfully', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
      
    } catch (error) {
      // Log error
      const duration = timer.end();
      moduleLogger.error('Request failed', {
        requestId,
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      // Send error response
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          requestId
        });
      }
    }
  };
}

module.exports = {
  createServerlessHandler,
  createModuleServerlessHandler
};
