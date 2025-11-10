/**
 * Error Handling Utilities
 * 
 * Provides custom error classes and error handling utilities
 * for the SkinTwin application.
 */

/**
 * Base SkinTwin error class
 */
export class SkinTwinError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SkinTwinError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Database error
 */
export class DatabaseError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Type safety error
 */
export class TypeSafetyError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TYPE_SAFETY_ERROR', 500, details);
    this.name = 'TypeSafetyError';
  }
}

/**
 * Formulation error
 */
export class FormulationError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FORMULATION_ERROR', 400, details);
    this.name = 'FormulationError';
  }
}

/**
 * Proof verification error
 */
export class ProofVerificationError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PROOF_VERIFICATION_ERROR', 422, details);
    this.name = 'ProofVerificationError';
  }
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown): never {
  if (error instanceof Error) {
    throw new DatabaseError(error.message, { originalError: error });
  }
  throw new DatabaseError('Unknown database error');
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  message: string,
  errors: Record<string, string[]>
): never {
  throw new ValidationError(message, { errors });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof SkinTwinError) {
        throw error;
      }
      throw new SkinTwinError(
        error instanceof Error ? error.message : 'Unknown error',
        'INTERNAL_ERROR',
        500,
        { originalError: error }
      );
    }
  }) as T;
}

/**
 * Assert condition with custom error
 */
export function assert(
  condition: boolean,
  message: string,
  ErrorClass: typeof SkinTwinError = SkinTwinError
): asserts condition {
  if (!condition) {
    throw new ErrorClass(message);
  }
}
