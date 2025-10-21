const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for log entries
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(stack && { stack }),
      ...(Object.keys(meta).length > 0 && { meta })
    };
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    let logMessage = `${timestamp} [${level}] ${message}`;
    if (context) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
    }
    if (Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    return logMessage;
  })
);

// Create transports
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// File transports for all environments
const fileTransports = [
  // Combined log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
    level: 'info'
  }),
  
  // Error log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
    level: 'error'
  }),
  
  // Payment-specific log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'payment-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
    level: 'info'
  }),
  
  // Webhook-specific log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'webhook-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
    level: 'info'
  })
];

transports.push(...fileTransports);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Create specialized loggers for different modules
const createModuleLogger = (moduleName) => {
  return {
    info: (message, context = {}) => {
      logger.info(message, { ...context, module: moduleName });
    },
    warn: (message, context = {}) => {
      logger.warn(message, { ...context, module: moduleName });
    },
    error: (message, context = {}) => {
      logger.error(message, { ...context, module: moduleName });
    },
    debug: (message, context = {}) => {
      logger.debug(message, { ...context, module: moduleName });
    }
  };
};

// Security utility to sanitize sensitive data
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth', 'authorization'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  
  return sanitized;
};

// Request ID generator
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Performance timing utility
const createTimer = () => {
  const start = Date.now();
  return {
    end: () => Date.now() - start
  };
};

// Payment logger (logs to payment-specific file)
const paymentLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'payment-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  ]
});

// Webhook logger (logs to webhook-specific file)
const webhookLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'webhook-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  ]
});

module.exports = {
  logger,
  createModuleLogger,
  sanitizeData,
  generateRequestId,
  createTimer,
  paymentLogger,
  webhookLogger
};
