/**
 * Proof Assistant Type Definitions
 * Central export point for all type definitions
 */

export * from './multiscale-field';

// Additional type definitions
export interface ProofStep {
  id: string;
  type: 'axiom' | 'theorem' | 'lemma' | 'corollary';
  statement: string;
  proof?: string;
  dependencies: string[];
}

export interface SkinModelAxiom {
  id: string;
  name: string;
  statement: string;
  scale: string;
  properties?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ComputationContext {
  precision: number;
  maxIterations: number;
  convergenceThreshold: number;
}
