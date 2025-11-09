/**
 * Error Handling Utilities for SkinTwin FormX
 * Provides consistent error handling patterns across the application
 */

export enum ErrorCode {
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Computation errors
  COMPUTATION_ERROR = 'COMPUTATION_ERROR',
  CONVERGENCE_ERROR = 'CONVERGENCE_ERROR',
  
  // File system errors
  FILE_ERROR = 'FILE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: Date;
}

export class SkinTwinError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SkinTwinError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SkinTwinError);
    }
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
      timestamp: this.timestamp,
    };
  }
}

export class DatabaseError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.DATABASE_ERROR, details);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }
}

export class ComputationError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.COMPUTATION_ERROR, details);
    this.name = 'ComputationError';
  }
}

/**
 * Handle database errors with consistent error transformation
 */
export function handleDatabaseError(error: unknown): never {
  if (error instanceof DatabaseError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new DatabaseError(error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }
  
  throw new DatabaseError('Unknown database error', {
    originalError: String(error),
  });
}

/**
 * Handle validation errors with detailed context
 */
export function handleValidationError(
  field: string,
  value: unknown,
  expectedType: string
): never {
  throw new ValidationError(
    `Validation failed for field "${field}"`,
    {
      field,
      value,
      expectedType,
    }
  );
}

/**
 * Handle computation errors with convergence information
 */
export function handleComputationError(
  operation: string,
  iterations: number,
  threshold: number
): never {
  throw new ComputationError(
    `Computation failed to converge for operation "${operation}"`,
    {
      operation,
      iterations,
      threshold,
    }
  );
}

/**
 * Safe error logging that doesn't throw
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
    context,
  };
  
  console.error('[SkinTwin Error]', JSON.stringify(errorInfo, null, 2));
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      logError(error);
    }
    return null;
  }
}

/**
 * Type guard for SkinTwinError
 */
export function isSkinTwinError(error: unknown): error is SkinTwinError {
  return error instanceof SkinTwinError;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
