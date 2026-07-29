import { logger } from '../utils/logger.js';

export function errorMiddleware(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path });

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Something went wrong',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
}