import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendError(res, `Duplicate value entered for ${field}. It must be unique.`, 409, {
      field,
      value: err.keyValue ? err.keyValue[field] : undefined
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return sendError(res, `Validation error: ${errors.join(', ')}`, 400, errors);
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, `Invalid ID format for ${err.path}: ${err.value}`, 400);
  }

  const statusCode = err.statusCode || 500;
  return sendError(res, err.message || 'Internal Server Error', statusCode);
};
