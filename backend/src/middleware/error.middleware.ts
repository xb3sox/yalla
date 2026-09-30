import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom error class
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Bad Request Error
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  // Handle validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = (err as any).errors;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }

  // Handle database errors
  if (err.name === 'UniqueViolationError') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error', {
      error: err.message,
      code,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

/**
 * Async handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
