/**
 * Multi-scale field type definitions for skin modeling
 * Supports molecular, cellular, tissue, and organ scales
 */

export type ScaleType = 'molecular' | 'cellular' | 'tissue' | 'organ' | 'system';

export interface SpatialDimensions {
  x: number;
  y: number;
  z: number;
}

export interface TemporalDimensions {
  start: number;
  end: number;
  resolution: number;
}

export interface FieldDimensions {
  spatial: SpatialDimensions | number[];
  temporal: TemporalDimensions | number;
}

export interface FieldMetadata {
  units: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
  author?: string;
}

export interface MultiscaleField {
  scale: ScaleType;
  data: number[];
  dimensions: FieldDimensions | {
    spatial: number[];
    temporal: number;
  };
  metadata: FieldMetadata | {
    units: string;
    description: string;
    [key: string]: any;
  };
  properties?: Record<string, unknown>;
  
  // Additional computed properties
  min?: number;
  max?: number;
  mean?: number;
  variance?: number;
}

export interface TensorOperation {
  type: 'add' | 'multiply' | 'convolve' | 'transform';
  fields: MultiscaleField[];
  result?: MultiscaleField;
  parameters?: Record<string, unknown>;
}

export interface ScaleTransition {
  from: ScaleType;
  to: ScaleType;
  operator: string;
  preserves?: string[];
}

export interface MultiscaleModel {
  scales: Record<ScaleType, MultiscaleField>;
  transitions: ScaleTransition[];
  metadata: FieldMetadata;
}

// Type guards
export function isMultiscaleField(obj: unknown): obj is MultiscaleField {
  if (typeof obj !== 'object' || obj === null) return false;
  const field = obj as Partial<MultiscaleField>;
  return (
    typeof field.scale === 'string' &&
    Array.isArray(field.data) &&
    typeof field.dimensions === 'object' &&
    typeof field.metadata === 'object'
  );
}

export function isValidScaleType(scale: string): scale is ScaleType {
  return ['molecular', 'cellular', 'tissue', 'organ', 'system'].includes(scale);
}

// Utility types
export type FieldArray = MultiscaleField[];
export type ScaleMap = Record<ScaleType, MultiscaleField>;
export type OperationResult = {
  success: boolean;
  field?: MultiscaleField;
  error?: string;
};
