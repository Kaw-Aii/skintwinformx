/**
 * Type Guards for Runtime Type Checking
 * Provides type-safe validation functions for complex types
 */

import type { MultiscaleField, ScaleType, FieldDimensions } from '../proof-assistant/types/multiscale-field';

/**
 * Check if value is a valid ScaleType
 */
export function isScaleType(value: unknown): value is ScaleType {
  return (
    typeof value === 'string' &&
    ['molecular', 'cellular', 'tissue', 'organ', 'system'].includes(value)
  );
}

/**
 * Check if value is a valid FieldDimensions object
 */
export function isFieldDimensions(value: unknown): value is FieldDimensions {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dims = value as Partial<FieldDimensions>;
  
  // Check spatial dimensions
  const hasSpatial = 'spatial' in dims && (
    Array.isArray(dims.spatial) ||
    (typeof dims.spatial === 'object' && dims.spatial !== null)
  );

  // Check temporal dimensions
  const hasTemporal = 'temporal' in dims && (
    typeof dims.temporal === 'number' ||
    (typeof dims.temporal === 'object' && dims.temporal !== null)
  );

  return hasSpatial && hasTemporal;
}

/**
 * Check if value is a valid MultiscaleField
 */
export function isMultiscaleField(value: unknown): value is MultiscaleField {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const field = value as Partial<MultiscaleField>;

  return (
    'scale' in field &&
    isScaleType(field.scale) &&
    'data' in field &&
    Array.isArray(field.data) &&
    field.data.every(item => typeof item === 'number') &&
    'dimensions' in field &&
    isFieldDimensions(field.dimensions) &&
    'metadata' in field &&
    typeof field.metadata === 'object' &&
    field.metadata !== null
  );
}

/**
 * Check if value is a number array
 */
export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

/**
 * Check if value is a string array
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Check if value is a valid record
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Check if value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Check if value is within range
 */
export function isInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && value >= min && value <= max && !isNaN(value);
}

/**
 * Check if value is a valid percentage (0-100)
 */
export function isPercentage(value: unknown): value is number {
  return isInRange(value, 0, 100);
}

/**
 * Check if value is a valid concentration (0-1)
 */
export function isConcentration(value: unknown): value is number {
  return isInRange(value, 0, 1);
}

/**
 * Check if object has required keys
 */
export function hasRequiredKeys<T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T {
  if (!isRecord(obj)) {
    return false;
  }

  return keys.every(key => key in obj);
}

/**
 * Assert that value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Check if value is a promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isRecord(value) && isFunction((value as any).then))
  );
}

/**
 * Check if error is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Validate ingredient ID format
 */
export function isValidIngredientId(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  // Ingredient IDs should be alphanumeric with optional hyphens/underscores
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

/**
 * Validate formulation ID format
 */
export function isValidFormulationId(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  // Formulation IDs should be alphanumeric with optional hyphens/underscores
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Validate URL format
 */
export function isValidUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type assertion with error throwing
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(errorMessage);
  }
}

/**
 * Safe type casting with fallback
 */
export function safeCast<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  fallback: T
): T {
  return guard(value) ? value : fallback;
}

/**
 * Validate array of specific type
 */
export function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

/**
 * Validate optional field
 */
export function isOptional<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | undefined {
  return value === undefined || guard(value);
}
