/**
 * Tests for the OpenCoq-inspired formal logic engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormalLogicEngine } from './formal-logic';
import type { VerificationRequest, FormulationConstraint } from './types';

describe('FormalLogicEngine', () => {
  let engine: FormalLogicEngine;

  beforeEach(() => {
    engine = new FormalLogicEngine();
  });

  it('should create a formal logic engine', () => {
    expect(engine).toBeDefined();
  });

  it('should generate formal proof for ingredient safety verification', () => {
    const constraints: FormulationConstraint[] = [
      {
        type: 'concentration',
        parameter: 'max_concentration',
        value: 2.0,
        operator: 'lte',
        required: true
      }
    ];

    const safetyProp = engine.verifyIngredientSafety('retinol', 1.0, constraints);

    expect(safetyProp.id).toContain('safety_retinol');
    expect(safetyProp.statement.name).toBe('IsSafe');
    expect(safetyProp.statement.args).toHaveLength(2);
    expect(safetyProp.conclusion.name).toBe('SafeForTopicalUse');
  });

  it('should verify penetration model with formal mathematics', () => {
    const ingredients = [
      { id: 'retinol', molecularWeight: 286.45, logP: 5.65 },
      { id: 'hyaluronic_acid', molecularWeight: 1500000, logP: -7.2 }
    ];

    const skinModel = {
      layers: [
        {
          id: 'sc',
          name: 'stratum_corneum',
          depth: 10,
          cellTypes: ['corneocytes'],
          permeability: 0.001,
          ph: 5.5,
          functions: ['barrier', 'protection']
        }
      ],
      barriers: [],
      transport: []
    };

    const penetrationProp = engine.verifyPenetrationModel(ingredients, skinModel);

    expect(penetrationProp.id).toContain('penetration_');
    expect(penetrationProp.statement.name).toBe('PenetrationModel');
    expect(penetrationProp.statement.args).toHaveLength(2);
    expect(penetrationProp.conclusion.name).toBe('ValidPenetrationProfile');
  });

  it('should generate formal proof for formulation hypothesis', async () => {
    const request: VerificationRequest = {
      hypothesis: 'Retinol serum improves skin texture',
      ingredients: [
        { id: 'retinol', concentration: 1.0 },
        { id: 'hyaluronic_acid', concentration: 2.0 }
      ],
      targetEffects: [
        {
          ingredientId: 'retinol',
          targetLayer: 'epidermis',
          effectType: 'anti_aging',
          magnitude: 0.8,
          timeframe: 2880, // 48 hours in minutes
          confidence: 0.9,
          mechanismOfAction: 'collagen_synthesis'
        }
      ],
      constraints: [
        {
          type: 'concentration',
          parameter: 'retinol_max',
          value: 2.0,
          operator: 'lte',
          required: true
        }
      ],
      skinModel: {
        layers: [
          {
            id: 'sc',
            name: 'stratum_corneum',
            depth: 10,
            cellTypes: ['corneocytes'],
            permeability: 0.001,
            ph: 5.5,
            functions: ['barrier', 'protection']
          }
        ],
        barriers: [],
        transport: []
      }
    };

    const formalProof = await engine.generateFormalProof(request);

    expect(formalProof.id).toContain('proof_');
    expect(formalProof.qed).toBe(true);
    expect(formalProof.tactics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'intros' }),
        expect.objectContaining({ name: 'apply' }),
        expect.objectContaining({ name: 'simpl' }),
        expect.objectContaining({ name: 'assumption' })
      ])
    );
  });

  it('should apply formal tactics correctly', () => {
    const proposition = {
      id: 'test_prop',
      statement: {
        type: 'proposition' as const,
        name: 'TestProp',
        args: []
      },
      hypothesis: [
        {
          type: 'predicate' as const,
          name: 'Assumption1',
          args: []
        }
      ],
      conclusion: {
        type: 'proposition' as const,
        name: 'Goal',
        args: []
      }
    };

    const introsTactic = { name: 'intros' };
    const result = engine.applyTactic(introsTactic, proposition);

    expect(result).toHaveLength(1);
    expect(result[0].hypothesis).toHaveLength(0);
  });

  it('should validate formal proofs correctly', () => {
    const validProof = {
      id: 'test_proof',
      proposition: 'test_theorem',
      tactics: [
        { name: 'intros' },
        { name: 'assumption' }
      ],
      qed: true,
      assumptions: ['hypothesis1']
    };

    const validation = engine.validateProof(validProof);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});