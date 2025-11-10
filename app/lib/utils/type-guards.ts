/**
 * Type Guard Utilities for Runtime Type Validation
 * Provides runtime type checking for TypeScript interfaces
 */

import type { MultiscaleField, ScaleType } from '../proof-assistant/types/multiscale-field';

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if value is a number array
 */
export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

/**
 * Check if value is a valid scale type
 */
export function isValidScaleType(value: unknown): value is ScaleType {
  return (
    typeof value === 'string' &&
    ['molecular', 'cellular', 'tissue', 'organ', 'system'].includes(value)
  );
}

/**
 * Check if value is a MultiscaleField
 */
export function isMultiscaleField(value: unknown): value is MultiscaleField {
  if (!isObject(value)) return false;

  const field = value as Partial<MultiscaleField>;

  return (
    isValidScaleType(field.scale) &&
    isNumberArray(field.data) &&
    isObject(field.dimensions) &&
    isObject(field.metadata)
  );
}

/**
 * Assert that value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

/**
 * Assert that value is a string
 */
export function assertString(
  value: unknown,
  message?: string
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message || `Expected string, got ${typeof value}`);
  }
}

/**
 * Assert that value is a number
 */
export function assertNumber(
  value: unknown,
  message?: string
): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message || `Expected number, got ${typeof value}`);
  }
}

/**
 * Assert that value is an object
 */
export function assertObject(
  value: unknown,
  message?: string
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(message || `Expected object, got ${typeof value}`);
  }
}

/**
 * Assert that value is a MultiscaleField
 */
export function assertMultiscaleField(
  value: unknown,
  message?: string
): asserts value is MultiscaleField {
  if (!isMultiscaleField(value)) {
    throw new Error(message || 'Value is not a valid MultiscaleField');
  }
}

/**
 * Safe property access with type checking
 */
export function getProperty<T>(
  obj: Record<string, unknown>,
  key: string,
  guard: (value: unknown) => value is T
): T | undefined {
  const value = obj[key];
  return guard(value) ? value : undefined;
}

/**
 * Safe property access with default value
 */
export function getPropertyWithDefault<T>(
  obj: Record<string, unknown>,
  key: string,
  defaultValue: T,
  guard: (value: unknown) => value is T
): T {
  const value = obj[key];
  return guard(value) ? value : defaultValue;
}
