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
    throw new ErrorClass(message, 'ASSERTION_ERROR');
  }
}

/**
 * Ingredient processing error
 */
export class IngredientError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INGREDIENT_ERROR', 400, details);
    this.name = 'IngredientError';
  }
}

/**
 * Network error
 */
export class NetworkError extends SkinTwinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
  }
}

/**
 * Handle ingredient errors
 */
export function handleIngredientError(
  message: string,
  ingredientId?: string,
  details?: Record<string, unknown>
): never {
  throw new IngredientError(message, { ingredientId, ...details });
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: unknown, endpoint?: string): never {
  if (error instanceof Error) {
    throw new NetworkError(error.message, { endpoint, originalError: error });
  }
  throw new NetworkError('Network request failed', { endpoint });
}

/**
 * Safe execution wrapper that catches and logs errors
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (error: SkinTwinError) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const skinTwinError = error instanceof SkinTwinError
      ? error
      : new SkinTwinError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN_ERROR'
        );

    if (onError) {
      onError(skinTwinError);
    }

    return fallback;
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new SkinTwinError(
    `Operation failed after ${maxRetries} attempts: ${lastError?.message}`,
    'RETRY_EXHAUSTED',
    500,
    { attempts: maxRetries, lastError: lastError?.message }
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof SkinTwinError) {
    const messages: Record<string, string> = {
      DATABASE_ERROR: 'A database error occurred. Please try again.',
      VALIDATION_ERROR: 'The provided data is invalid.',
      NETWORK_ERROR: 'Network connection failed. Please check your connection.',
      FORMULATION_ERROR: 'An error occurred while processing the formulation.',
      INGREDIENT_ERROR: 'An error occurred while processing ingredient data.',
      PROOF_VERIFICATION_ERROR: 'Proof verification failed.',
    };
    return messages[error.code] || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Log error with context and timestamp
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const message = getUserFriendlyMessage(error);
  const contextStr = context ? `[${context}] ` : '';

  console.error(`${timestamp} ${contextStr}${message}`);

  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }

  if (error instanceof SkinTwinError && error.details) {
    console.error('Error details:', error.details);
  }
}
