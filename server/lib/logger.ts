import winston from 'winston';
import 'winston-daily-rotate-file';
import expressWinston from 'express-winston';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Configure the Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'yorkie-stories' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Rotating file transport for all logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Separate file for error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Request logging middleware
export const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req) => {
    // Ignore health check endpoints or static files
    return req.url.startsWith('/health') || req.url.startsWith('/static');
  }
});

// Error logging middleware
export const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger
});

// Export logging functions
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, { meta });
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, { meta });
  },
  info: (message: string, meta?: any) => {
    logger.info(message, { meta });
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, { meta });
  },
  // Special method for API errors
  apiError: (message: string, error: any) => {
    logger.error('API Error', {
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: error.status || error.statusCode,
        code: error.code
      }
    });
  }
};

// Export the Winston logger instance for advanced usage
export const winstonLogger = logger;