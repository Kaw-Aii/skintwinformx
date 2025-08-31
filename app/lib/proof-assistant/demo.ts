/**
 * Demonstration of OpenCoq-Inspired Formulation Proof Assistant
 * 
 * Shows how to use the enhanced cognitive proof assistant for formal verification
 * of skincare formulation hypotheses using multi-scale skin model interactions.
 */

import { OpenCoqFormulationEngine } from './opencoq-integration';
import { SkinModelAxiomSystem, CoqInspiredTactics } from './skin-model-axioms';
import type { VerificationRequest } from './types';

/**
 * Example usage of the OpenCoq-inspired proof assistant
 */
export class FormulationProofDemo {
  private readonly _engine: OpenCoqFormulationEngine;
  private readonly _axiomSystem: SkinModelAxiomSystem;

  constructor() {
    this._engine = new OpenCoqFormulationEngine();
    this._axiomSystem = new SkinModelAxiomSystem();
  }

  /**
   * Demonstrate verification of a vitamin C serum formulation
   */
  public async demonstrateVitaminCVerification(): Promise<void> {
    console.log('🧪 OpenCoq Formulation Proof Assistant Demo');
    console.log('═══════════════════════════════════════════');
    
    const vitaminCRequest: VerificationRequest = {
      hypothesis: 'A 20% L-Ascorbic Acid serum with 1% Hyaluronic Acid will effectively deliver vitamin C to the epidermis while maintaining stability at pH 3.5',
      
      ingredients: [
        {
          id: 'l_ascorbic_acid',
          label: 'L-Ascorbic Acid',
          inci_name: 'Ascorbic Acid',
          category: 'active',
          molecular_weight: 176.12,
          concentration: 20.0,
          safety_rating: 'moderate'
        },
        {
          id: 'hyaluronic_acid',
          label: 'Hyaluronic Acid',
          inci_name: 'Sodium Hyaluronate', 
          category: 'humectant',
          molecular_weight: 1500000,
          concentration: 1.0,
          safety_rating: 'high'
        }
      ],

      targetEffects: [
        {
          ingredientId: 'l_ascorbic_acid',
          targetLayer: 'epidermis',
          effectType: 'antioxidant',
          magnitude: 0.8,
          timeframe: 60,
          confidence: 0.85,
          mechanismOfAction: 'Free radical scavenging and collagen synthesis stimulation'
        },
        {
          ingredientId: 'hyaluronic_acid',
          targetLayer: 'stratum_corneum',
          effectType: 'hydration',
          magnitude: 0.9,
          timeframe: 30,
          confidence: 0.95,
          mechanismOfAction: 'Water binding and barrier function enhancement'
        }
      ],

      constraints: [
        {
          type: 'ph',
          parameter: 'formulation_ph',
          value: 3.5,
          operator: 'eq',
          required: true
        },
        {
          type: 'concentration',
          parameter: 'total_active',
          value: 25,
          operator: 'lte',
          required: true
        },
        {
          type: 'temperature',
          parameter: 'storage_temp',
          value: 25,
          operator: 'lte',
          required: false
        }
      ],

      skinModel: {
        layers: [
          {
            id: 'stratum_corneum',
            name: 'Stratum Corneum',
            depth: 15,
            cellTypes: ['corneocytes'],
            permeability: 0.001,
            ph: 5.5,
            functions: ['barrier', 'protection']
          },
          {
            id: 'viable_epidermis',
            name: 'Viable Epidermis',
            depth: 100,
            cellTypes: ['keratinocytes'],
            permeability: 0.1,
            ph: 7.4,
            functions: ['renewal', 'pigmentation']
          }
        ],
        barriers: [
          {
            id: 'lipid_barrier',
            location: 'stratum_corneum',
            type: 'lipid',
            strength: 0.9,
            selectivity: ['hydrophobic']
          }
        ],
        transport: [
          {
            id: 'passive_diffusion',
            type: 'passive',
            pathway: 'transcellular',
            efficiency: 0.3,
            molecularWeightLimit: 500
          }
        ]
      }
    };

    console.log('\n📋 Verification Request:');
    console.log(`   Hypothesis: ${vitaminCRequest.hypothesis}`);
    console.log(`   Ingredients: ${vitaminCRequest.ingredients.map(i => `${i.label} (${i.concentration}%)`).join(', ')}`);
    
    try {
      console.log('\n⚡ Starting OpenCoq-inspired formal verification...');
      
      // Show axiom system
      console.log('\n📐 Skin Model Axioms:');
      const axioms = this._axiomSystem.getAxioms();
      console.log(`   - Penetration Law: ${axioms.penetrationLaw.statement.name}`);
      console.log(`   - Diffusion Equation: ${axioms.diffusionEquation.statement.name}`);
      console.log(`   - Barrier Function: ${axioms.barrierFunction.statement.name}`);
      console.log(`   - Safety Constraints: ${axioms.safetyConstraints.length} rules`);
      console.log(`   - Compatibility Rules: ${axioms.compatibilityRules.length} rules`);

      // Perform verification
      const result = await this._engine.verifyFormulationHypothesis(vitaminCRequest);
      
      console.log('\n✅ Verification Results:');
      console.log(`   Valid: ${result.isValid ? '✓' : '✗'}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Proof Steps: ${result.proof.steps.length}`);
      console.log(`   Warnings: ${result.warnings.length}`);
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      if (result.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        result.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }

      console.log('\n🔬 Formal Proof Summary:');
      console.log(`   Hypothesis: ${result.proof.hypothesis}`);
      console.log(`   Conclusion: ${result.proof.conclusion}`);
      console.log(`   Validity: ${(result.proof.validity * 100).toFixed(1)}%`);
      console.log(`   Completeness: ${(result.proof.completeness * 100).toFixed(1)}%`);
      
      if (result.alternativeFormulations && result.alternativeFormulations.length > 0) {
        console.log('\n🔄 Alternative Formulations:');
        result.alternativeFormulations.forEach((alt, idx) => {
          console.log(`   ${idx + 1}. ${alt.reasoning} (confidence: ${(alt.confidence * 100).toFixed(1)}%)`);
        });
      }

    } catch (error) {
      console.error('\n❌ Verification failed:', error);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✨ Demo completed - OpenCoq integration active!');
  }

  /**
   * Demonstrate Coq-inspired tactics
   */
  public demonstrateCoqTactics(): void {
    console.log('\n🎯 Coq-Inspired Tactics Demo');
    console.log('═══════════════════════════════');

    // Demonstrate intros tactic
    const assumptions = ['ingredient_vitamin_c', 'concentration_20_percent', 'ph_3_5'];
    const introTerms = CoqInspiredTactics.intros(assumptions);
    console.log('🔧 intros tactic:', introTerms.map(t => t.name).join(', '));

    // Demonstrate unfold tactic
    const unfoldTerm = CoqInspiredTactics.unfold('BarrierFunction');
    console.log('🔧 unfold tactic:', unfoldTerm.name);

    // Demonstrate rewrite tactic
    const rewriteTerm = CoqInspiredTactics.rewrite('fick_law', 'left_to_right');
    console.log('🔧 rewrite tactic:', rewriteTerm.name);

    console.log('✅ Tactics demonstration complete!');
  }
}

// Export for use in other modules - removed duplicate export