/**
 * Cognitive Accounting System for SKIN-TWIN Proof Assistant
 *
 * Implements relevance realization and cognitive state management
 * for formulation verification processes.
 */

import type { CognitiveState, RelevanceRealizationContext, ProofStep } from './types';

/**
 * Manages cognitive resources and relevance realization during proof generation
 */
export class CognitiveAccountingSystem {
  private _cognitiveState: CognitiveState;
  private _relevanceThreshold: number;
  private _attentionCapacity: number;
  private _memoryDecayRate: number;

  constructor(relevanceThreshold = 0.5, attentionCapacity = 7, memoryDecayRate = 0.1) {
    this._relevanceThreshold = relevanceThreshold;
    this._attentionCapacity = attentionCapacity;
    this._memoryDecayRate = memoryDecayRate;
    this._cognitiveState = this._initializeCognitiveState();
  }

  /**
   * Update cognitive state based on new context
   */
  updateCognitiveState(context: RelevanceRealizationContext): void {
    // Update relevance weights based on current goal alignment
    this._updateRelevanceWeights(context);

    // Manage attentional focus with capacity constraints
    this._updateAttentionalFocus(context);

    // Apply memory decay and update activations
    this._updateMemoryActivation(context);

    // Calculate uncertainty levels for current context
    this._updateUncertaintyLevels(context);
  }

  /**
   * Calculate relevance score for a given proof step
   */
  calculateRelevanceScore(step: ProofStep, context: RelevanceRealizationContext): number {
    let relevanceScore = 0;

    // Goal alignment relevance
    const goalAlignment = this._calculateGoalAlignment(step, context);
    relevanceScore += goalAlignment * 0.4;

    // Ingredient relevance
    const ingredientRelevance = this._calculateIngredientRelevance(step, context);
    relevanceScore += ingredientRelevance * 0.3;

    // Evidence quality relevance
    const evidenceRelevance = this._calculateEvidenceRelevance(step);
    relevanceScore += evidenceRelevance * 0.2;

    // Temporal relevance (recency bias)
    const temporalRelevance = this._calculateTemporalRelevance(step);
    relevanceScore += temporalRelevance * 0.1;

    return Math.min(relevanceScore, 1.0);
  }

  /**
   * Allocate cognitive resources for proof generation
   */
  allocateCognitiveResources(
    steps: ProofStep[],
    context: RelevanceRealizationContext,
  ): {
    prioritySteps: ProofStep[];
    cognitiveLoad: number;
    resourceAllocation: Map<string, number>;
  } {
    // Calculate relevance scores for all steps
    const stepRelevance = steps.map((step) => ({
      step,
      relevance: this.calculateRelevanceScore(step, context),
    }));

    // Sort by relevance and apply attention capacity constraint
    const prioritySteps = stepRelevance
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, this._attentionCapacity)
      .map((item) => item.step);

    // Calculate cognitive load
    const cognitiveLoad = this._calculateCognitiveLoad(prioritySteps);

    // Create resource allocation map
    const resourceAllocation = new Map<string, number>();
    prioritySteps.forEach((step, index) => {
      const allocation = Math.max(0.1, 1.0 - index * 0.1);
      resourceAllocation.set(step.id, allocation);
    });

    return {
      prioritySteps,
      cognitiveLoad,
      resourceAllocation,
    };
  }

  /**
   * Implement relevance realization algorithm
   */
  realizeRelevance(candidates: ProofStep[], context: RelevanceRealizationContext): ProofStep[] {
    // Phase 1: Salience detection
    const salientSteps = this._detectSalience(candidates, context);

    // Phase 2: Coherence assessment
    const coherentSteps = this._assessCoherence(salientSteps, context);

    // Phase 3: Elegance evaluation
    const elegantSteps = this._evaluateElegance(coherentSteps);

    // Phase 4: Integration synthesis
    return this._synthesizeIntegration(elegantSteps, context);
  }

  /**
   * Track cognitive effort and learning
   */
  trackCognitiveEffort(step: ProofStep, effort: number): void {
    const stepId = step.id;
    const currentEffort = this._cognitiveState.memoryActivation.get(`effort_${stepId}`) || 0;

    // Update effort tracking with exponential moving average
    const alpha = 0.3;
    const newEffort = alpha * effort + (1 - alpha) * currentEffort;
    this._cognitiveState.memoryActivation.set(`effort_${stepId}`, newEffort);

    // Update uncertainty based on effort
    const uncertainty = Math.min(effort / 10.0, 1.0);
    this._cognitiveState.uncertaintyLevels.set(stepId, uncertainty);
  }

  /**
   * Get current cognitive state
   */
  getCognitiveState(): CognitiveState {
    return { ...this._cognitiveState };
  }

  // Private helper methods

  private _initializeCognitiveState(): CognitiveState {
    return {
      relevanceWeights: new Map(),
      attentionalFocus: [],
      memoryActivation: new Map(),
      uncertaintyLevels: new Map(),
    };
  }

  private _updateRelevanceWeights(context: RelevanceRealizationContext): void {
    // Increase weights for goal-relevant ingredients
    context.activeIngredients.forEach((ingredientId) => {
      const currentWeight = this._cognitiveState.relevanceWeights.get(ingredientId) || 0;
      const goalRelevance = context.currentGoal.toLowerCase().includes(ingredientId.toLowerCase()) ? 0.2 : 0.1;
      this._cognitiveState.relevanceWeights.set(ingredientId, currentWeight + goalRelevance);
    });

    // Apply decay to all weights
    for (const [key, weight] of this._cognitiveState.relevanceWeights) {
      const decayedWeight = weight * (1 - this._memoryDecayRate);

      if (decayedWeight < 0.01) {
        this._cognitiveState.relevanceWeights.delete(key);
      } else {
        this._cognitiveState.relevanceWeights.set(key, decayedWeight);
      }
    }
  }

  private _updateAttentionalFocus(context: RelevanceRealizationContext): void {
    // Combine current goal, active ingredients, and skin condition
    const candidateFoci = [
      context.currentGoal,
      ...context.activeIngredients,
      context.skinCondition,
      ...context.userConstraints,
    ].filter(Boolean);

    // Calculate relevance scores for each focus candidate
    const scoredFoci = candidateFoci.map((focus) => ({
      focus,
      score: this._cognitiveState.relevanceWeights.get(focus) || 0.1,
    }));

    // Select top candidates within attention capacity
    this._cognitiveState.attentionalFocus = scoredFoci
      .sort((a, b) => b.score - a.score)
      .slice(0, this._attentionCapacity)
      .map((item) => item.focus);
  }

  private _updateMemoryActivation(context: RelevanceRealizationContext): void {
    const currentTime = Date.now();

    // Activate memories related to current context
    context.activeIngredients.forEach((ingredientId) => {
      this._cognitiveState.memoryActivation.set(`ingredient_${ingredientId}`, currentTime);
    });

    this._cognitiveState.memoryActivation.set('current_goal', currentTime);
    this._cognitiveState.memoryActivation.set('skin_condition', currentTime);

    // Apply temporal decay to memory activations
    for (const [key, timestamp] of this._cognitiveState.memoryActivation) {
      const age = currentTime - timestamp;
      const decayFactor = Math.exp(-age / (1000 * 60 * 60)); // 1-hour half-life

      if (decayFactor < 0.1) {
        this._cognitiveState.memoryActivation.delete(key);
      } else {
        this._cognitiveState.memoryActivation.set(key, timestamp * decayFactor);
      }
    }
  }

  private _updateUncertaintyLevels(context: RelevanceRealizationContext): void {
    // Calculate uncertainty based on missing information and complexity
    const totalConstraints = context.userConstraints.length;
    const environmentalFactors = context.environmentalFactors.size;

    const complexityUncertainty = Math.min((context.activeIngredients.length * totalConstraints) / 100.0, 0.8);

    const informationUncertainty = Math.max(0.1, 1.0 - environmentalFactors / 10.0);

    this._cognitiveState.uncertaintyLevels.set('complexity', complexityUncertainty);
    this._cognitiveState.uncertaintyLevels.set('information', informationUncertainty);
    this._cognitiveState.uncertaintyLevels.set('overall', (complexityUncertainty + informationUncertainty) / 2.0);
  }

  private _calculateGoalAlignment(step: ProofStep, context: RelevanceRealizationContext): number {
    const stepText = step.statement.toLowerCase();
    const goalText = context.currentGoal.toLowerCase();

    // Simple keyword matching for goal alignment
    const goalWords = goalText.split(/\s+/).filter((word) => word.length > 3);
    const matchingWords = goalWords.filter((word) => stepText.includes(word));

    return matchingWords.length / Math.max(goalWords.length, 1);
  }

  private _calculateIngredientRelevance(step: ProofStep, context: RelevanceRealizationContext): number {
    const stepText = step.statement.toLowerCase();
    const matchingIngredients = context.activeIngredients.filter((ing) => stepText.includes(ing.toLowerCase()));

    return matchingIngredients.length / Math.max(context.activeIngredients.length, 1);
  }

  private _calculateEvidenceRelevance(step: ProofStep): number {
    if (step.evidence.length === 0) {
      return 0.1;
    }

    const avgReliability = step.evidence.reduce((sum, ev) => sum + ev.reliability, 0) / step.evidence.length;
    const avgRelevance = step.evidence.reduce((sum, ev) => sum + ev.relevance, 0) / step.evidence.length;

    return (avgReliability + avgRelevance) / 2.0;
  }

  private _calculateTemporalRelevance(step: ProofStep): number {
    // Assume newer steps are more relevant (recency bias)
    const stepTime = parseInt(step.id.split('_').pop() || '0');
    const currentTime = Date.now();
    const age = currentTime - stepTime;

    // Exponential decay with 1-hour half-life
    return Math.exp(-age / (1000 * 60 * 60));
  }

  private _calculateCognitiveLoad(steps: ProofStep[]): number {
    // Calculate load based on step complexity and evidence requirements
    let totalLoad = 0;

    for (const step of steps) {
      let stepLoad = 0.1; // Base load

      // Add load for premises
      stepLoad += step.premises.length * 0.05;

      // Add load for evidence processing
      stepLoad += step.evidence.length * 0.03;

      // Add load for uncertainty
      stepLoad += (1 - step.confidence) * 0.1;

      totalLoad += stepLoad;
    }

    return Math.min(totalLoad, 1.0);
  }

  private _detectSalience(candidates: ProofStep[], context: RelevanceRealizationContext): ProofStep[] {
    // Filter steps that meet minimum relevance threshold
    return candidates.filter((step) => {
      const relevance = this.calculateRelevanceScore(step, context);
      return relevance >= this._relevanceThreshold;
    });
  }

  private _assessCoherence(steps: ProofStep[], _context: RelevanceRealizationContext): ProofStep[] {
    // Group steps by logical chains and assess coherence
    const coherentSteps: ProofStep[] = [];

    for (const step of steps) {
      // Check if step has logical connections to other steps
      const hasConnections = steps.some(
        (otherStep) => otherStep.premises.includes(step.id) || step.premises.includes(otherStep.id),
      );

      if (hasConnections || step.type === 'assumption' || step.type === 'conclusion') {
        coherentSteps.push(step);
      }
    }

    return coherentSteps;
  }

  private _evaluateElegance(steps: ProofStep[]): ProofStep[] {
    // Prefer steps with higher confidence and simpler premises
    return steps.sort((a, b) => {
      const eleganceA = a.confidence / Math.max(a.premises.length, 1);
      const eleganceB = b.confidence / Math.max(b.premises.length, 1);

      return eleganceB - eleganceA;
    });
  }

  private _synthesizeIntegration(steps: ProofStep[], _context: RelevanceRealizationContext): ProofStep[] {
    // Ensure logical flow from assumptions to conclusions
    const orderedSteps: ProofStep[] = [];
    const processed = new Set<string>();

    // Add assumptions first
    steps
      .filter((s) => s.type === 'assumption')
      .forEach((step) => {
        orderedSteps.push(step);
        processed.add(step.id);
      });

    // Add steps with satisfied premises
    let added = true;

    while (added && processed.size < steps.length) {
      added = false;

      for (const step of steps) {
        if (!processed.has(step.id)) {
          const premisesSatisfied = step.premises.every(
            (premise) => processed.has(premise) || orderedSteps.some((s) => s.statement.includes(premise)),
          );

          if (premisesSatisfied) {
            orderedSteps.push(step);
            processed.add(step.id);
            added = true;
          }
        }
      }
    }

    return orderedSteps;
  }
}
