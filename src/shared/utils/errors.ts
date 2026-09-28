/**
 * Error Handling Utilities
 * 
 * Provides standardized error handling and custom error classes.
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Only use captureStackTrace if available (V8 environments)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, code, 400, true);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, code, 404, true);
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, code, 401, true);
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, code, 403, true);
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code: string = 'CONFLICT') {
    super(message, code, 409, true);
  }
}

/**
 * Business rule error
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_RULE_VIOLATION') {
    super(message, code, 422, true);
  }
}

/**
 * State transition error
 */
export class StateTransitionError extends AppError {
  constructor(message: string, code: string = 'INVALID_STATE_TRANSITION') {
    super(message, code, 422, true);
  }
}

/**
 * Capacity error
 */
export class CapacityError extends AppError {
  constructor(message: string = 'Capacity exceeded', code: string = 'CAPACITY_EXCEEDED') {
    super(message, code, 422, true);
  }
}

/**
 * Duplicate error
 */
export class DuplicateError extends AppError {
  constructor(message: string = 'Duplicate entry', code: string = 'DUPLICATE_ENTRY') {
    super(message, code, 409, true);
  }
}

/**
 * Expired error
 */
export class ExpiredError extends AppError {
  constructor(message: string = 'Resource expired', code: string = 'EXPIRED') {
    super(message, code, 410, true);
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    messageAr?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: AppError,
  messageAr?: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      messageAr,
      details,
    },
  };
}

/**
 * Check if error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError && error.isOperational;
}

/**
 * Get error message based on language
 */
export function getErrorMessage(
  error: AppError,
  lang: 'en' | 'ar',
  fallbackMessage?: string
): string {
  if (lang === 'ar' && 'messageAr' in error) {
    return (error as any).messageAr || fallbackMessage || error.message;
  }
  return error.message;
}
