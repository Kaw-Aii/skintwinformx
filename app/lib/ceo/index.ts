/**
 * CEO (Cognitive Execution Orchestration) Module
 * 
 * Named "CEO" as a symbolic link to the actual CEO, Jax.
 * 
 * This module provides the main interface to the JAX-powered
 * cognitive execution subsystem for the SkinTwin-ASI project.
 */

export * from './types';
export { JAXEngine, getJAXEngine } from './jax-engine';
export { CognitiveExecutionOrchestrator, getCEO } from './cognitive-orchestration';
