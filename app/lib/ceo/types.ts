/**
 * CEO (Cognitive Execution Orchestration) Types
 * 
 * This module defines types for the JAX-powered cognitive execution subsystem,
 * named "CEO" as a symbolic link to the actual CEO, Jax.
 * 
 * The CEO subsystem handles:
 * - Machine learning operations
 * - Auto-differentiation for optimization
 * - Neural network inference
 * - Tensor computations
 */

import type { MultiscaleField } from '../proof-assistant/types/multiscale-field';

/**
 * JAX tensor operation types
 */
export type JAXOperationType = 
  | 'matmul'           // Matrix multiplication
  | 'conv'             // Convolution
  | 'grad'             // Gradient computation
  | 'jit'              // Just-in-time compilation
  | 'vmap'             // Vectorized mapping
  | 'pmap'             // Parallel mapping
  | 'scan'             // Sequential scan
  | 'fft'              // Fast Fourier Transform
  | 'softmax'          // Softmax activation
  | 'relu'             // ReLU activation
  | 'sigmoid'          // Sigmoid activation
  | 'tanh';            // Tanh activation

/**
 * JAX tensor operation request
 */
export interface JAXTensorOperation {
  operation: JAXOperationType;
  inputs: number[][][];  // Array of 2D tensors (matrices)
  parameters?: {
    axis?: number;
    keepdims?: boolean;
    learning_rate?: number;
    momentum?: number;
    epsilon?: number;
    [key: string]: any;
  };
  metadata?: {
    device?: 'cpu' | 'gpu' | 'tpu';
    precision?: 'float16' | 'float32' | 'float64';
    batch_size?: number;
  };
}

/**
 * JAX tensor operation result
 */
export interface JAXTensorResult {
  success: boolean;
  output?: number[][];
  error?: string;
  execution_time_ms?: number;
  memory_used_mb?: number;
  device_used?: string;
}

/**
 * Gradient computation request
 */
export interface GradientRequest {
  function_name: string;
  inputs: number[][];
  target_variable: string;
  order?: number; // 1 for first derivative, 2 for second, etc.
}

/**
 * Gradient computation result
 */
export interface GradientResult {
  gradients: number[][];
  hessian?: number[][][]; // For second-order gradients
  jacobian?: number[][][]; // For vector-valued functions
}

/**
 * Neural network architecture definition
 */
export interface NeuralNetworkArchitecture {
  layers: NetworkLayer[];
  input_shape: number[];
  output_shape: number[];
  loss_function: 'mse' | 'cross_entropy' | 'binary_cross_entropy' | 'huber';
  optimizer: 'sgd' | 'adam' | 'rmsprop' | 'adagrad';
  learning_rate: number;
}

/**
 * Neural network layer definition
 */
export interface NetworkLayer {
  type: 'dense' | 'conv2d' | 'maxpool' | 'dropout' | 'batchnorm' | 'attention';
  units?: number;
  activation?: 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';
  kernel_size?: number[];
  strides?: number[];
  padding?: 'same' | 'valid';
  dropout_rate?: number;
}

/**
 * Training configuration
 */
export interface TrainingConfig {
  epochs: number;
  batch_size: number;
  validation_split: number;
  early_stopping?: {
    patience: number;
    min_delta: number;
  };
  callbacks?: string[];
}

/**
 * Model inference request
 */
export interface InferenceRequest {
  model_id: string;
  inputs: number[][];
  batch_size?: number;
}

/**
 * Model inference result
 */
export interface InferenceResult {
  predictions: number[][];
  confidence_scores?: number[];
  attention_weights?: number[][][];
}

/**
 * Formulation optimization request
 */
export interface FormulationOptimizationRequest {
  current_formulation: any;
  target_properties: {
    property: string;
    target_value: number;
    weight: number;
  }[];
  constraints: {
    parameter: string;
    min?: number;
    max?: number;
    fixed?: boolean;
  }[];
  optimization_method: 'gradient_descent' | 'adam' | 'lbfgs' | 'genetic';
  max_iterations: number;
}

/**
 * Formulation optimization result
 */
export interface FormulationOptimizationResult {
  optimized_formulation: any;
  objective_value: number;
  iterations: number;
  convergence_status: 'converged' | 'max_iterations' | 'diverged';
  optimization_history: {
    iteration: number;
    objective_value: number;
    gradient_norm: number;
  }[];
}

/**
 * Cognitive orchestration context
 */
export interface CognitiveContext {
  task_id: string;
  task_type: 'analysis' | 'optimization' | 'prediction' | 'generation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  resources: {
    max_memory_mb: number;
    max_time_seconds: number;
    preferred_device: 'cpu' | 'gpu' | 'tpu';
  };
  metadata?: Record<string, any>;
}

/**
 * Cognitive execution result
 */
export interface CognitiveExecutionResult {
  task_id: string;
  status: 'success' | 'failure' | 'partial';
  result?: any;
  error?: string;
  metrics: {
    execution_time_ms: number;
    memory_used_mb: number;
    cpu_utilization: number;
    gpu_utilization?: number;
  };
  insights?: string[];
  recommendations?: string[];
}

/**
 * Multi-scale analysis request
 */
export interface MultiScaleAnalysisRequest {
  fields: MultiscaleField[];
  analysis_type: 'correlation' | 'causation' | 'interaction' | 'emergence';
  scales_to_analyze: string[];
  cross_scale_interactions: boolean;
}

/**
 * Multi-scale analysis result
 */
export interface MultiScaleAnalysisResult {
  correlations: {
    scale1: string;
    scale2: string;
    correlation_coefficient: number;
    p_value: number;
  }[];
  causal_relationships: {
    cause: string;
    effect: string;
    strength: number;
    confidence: number;
  }[];
  emergent_properties: {
    property: string;
    scale: string;
    value: number;
    source_scales: string[];
  }[];
  insights: string[];
}

/**
 * Skin condition prediction request
 */
export interface SkinConditionPredictionRequest {
  features: {
    age: number;
    skin_type: string;
    environmental_factors: Record<string, number>;
    product_usage: string[];
    genetic_markers?: string[];
  };
  conditions_to_predict: string[];
  time_horizon_days: number;
}

/**
 * Skin condition prediction result
 */
export interface SkinConditionPredictionResult {
  predictions: {
    condition: string;
    probability: number;
    confidence_interval: [number, number];
    risk_factors: string[];
    protective_factors: string[];
  }[];
  recommendations: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    expected_benefit: string;
  }[];
}

/**
 * CEO subsystem status
 */
export interface CEOStatus {
  initialized: boolean;
  jax_version?: string;
  available_devices: string[];
  current_device: string;
  memory_available_mb: number;
  active_tasks: number;
  total_tasks_completed: number;
  average_execution_time_ms: number;
}
