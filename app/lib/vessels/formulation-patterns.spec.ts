/**
 * Tests for Formulation Pattern Analysis and Utilities
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  FormulationPatternManager,
  PatternCategory,
  type PatternAnalysisResult,
  type FormulationPattern,
  formatPattern,
  PATTERN_CATEGORIES,
} from '~/lib/vessels/formulation-patterns';

// Mock data for testing
const mockPatternData: PatternAnalysisResult = {
  atomic_functions: [
    {
      name: 'SKIN CONDITIONING',
      count: 1000,
      ingredients: ['Glycerin', 'Hyaluronic Acid', 'Ceramides'],
    },
    {
      name: 'HUMECTANT',
      count: 500,
      ingredients: ['Glycerin', 'Propylene Glycol'],
    },
    {
      name: 'ANTIMICROBIAL',
      count: 200,
      ingredients: ['Phenoxyethanol', 'Benzyl Alcohol'],
    },
  ],
  function_combinations: [
    {
      functions: ['SKIN CONDITIONING'],
      count: 800,
      ingredients: ['Ingredient A', 'Ingredient B'],
      pattern_id: 'FP_SC',
    },
    {
      functions: ['SKIN CONDITIONING', 'HUMECTANT'],
      count: 300,
      ingredients: ['Ingredient C'],
      pattern_id: 'FP_SC_H',
    },
  ],
  formulation_patterns: [
    {
      id: 'FP_SC',
      name: 'SKIN CONDITIONING',
      functions: ['SKIN CONDITIONING'],
      function_count: 1,
      typical_applications: ['Moisturizers', 'Serums', 'Creams'],
      ingredient_examples: ['Glycerin', 'Hyaluronic Acid'],
      usage_frequency: 800,
      complexity_score: 2,
      category: PatternCategory.ACTIVE_DELIVERY,
      recommended_concentration_range: { min: 0.5, max: 10.0 },
      synergistic_patterns: [],
      incompatible_patterns: [],
    },
    {
      id: 'FP_SC_H',
      name: 'SKIN CONDITIONING + HUMECTANT',
      functions: ['SKIN CONDITIONING', 'HUMECTANT'],
      function_count: 2,
      typical_applications: ['Serums', 'Moisturizers'],
      ingredient_examples: ['Glycerin', 'Sodium Hyaluronate'],
      usage_frequency: 300,
      complexity_score: 3,
      category: PatternCategory.ACTIVE_DELIVERY,
      recommended_concentration_range: { min: 1.0, max: 15.0 },
      synergistic_patterns: ['FP_SC'],
      incompatible_patterns: [],
    },
    {
      id: 'FP_AM',
      name: 'ANTIMICROBIAL',
      functions: ['ANTIMICROBIAL'],
      function_count: 1,
      typical_applications: ['All Products (Preservation System)'],
      ingredient_examples: ['Phenoxyethanol'],
      usage_frequency: 200,
      complexity_score: 2,
      category: PatternCategory.PRESERVATION,
      recommended_concentration_range: { min: 0.01, max: 2.0 },
      synergistic_patterns: [],
      incompatible_patterns: [],
    },
    {
      id: 'FP_SE',
      name: 'SURFACTANT - EMULSIFYING',
      functions: ['SURFACTANT - EMULSIFYING'],
      function_count: 1,
      typical_applications: ['Creams', 'Lotions'],
      ingredient_examples: ['Polysorbate 20'],
      usage_frequency: 150,
      complexity_score: 3,
      category: PatternCategory.EMULSIFICATION,
      recommended_concentration_range: { min: 0.5, max: 5.0 },
      synergistic_patterns: [],
      incompatible_patterns: [],
    },
  ],
  statistics: {
    total_ingredients: 1500,
    total_atomic_functions: 3,
    total_combinations: 2,
    total_patterns_generated: 4,
    most_common_function: 'SKIN CONDITIONING',
    most_complex_combination: ['SKIN CONDITIONING', 'HUMECTANT'],
    average_functions_per_ingredient: 1.5,
  },
};

describe('FormulationPatternManager', () => {
  let manager: FormulationPatternManager;

  beforeAll(() => {
    manager = new FormulationPatternManager(mockPatternData);
  });

  describe('findByCategory', () => {
    it('should find patterns by category', () => {
      const activePatterns = manager.findByCategory(
        PatternCategory.ACTIVE_DELIVERY
      );
      expect(activePatterns).toHaveLength(2);
      expect(activePatterns[0].category).toBe(PatternCategory.ACTIVE_DELIVERY);
    });

    it('should return empty array for non-existent category', () => {
      const patterns = manager.findByCategory(PatternCategory.SENSORY_ENHANCEMENT);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('findByFunctions', () => {
    it('should find patterns containing specific functions', () => {
      const patterns = manager.findByFunctions(['SKIN CONDITIONING']);
      expect(patterns.length).toBeGreaterThan(0);
      expect(
        patterns.every((p) =>
          p.functions.some((f) =>
            f.toUpperCase().includes('SKIN CONDITIONING')
          )
        )
      ).toBe(true);
    });

    it('should find patterns with multiple functions', () => {
      const patterns = manager.findByFunctions([
        'SKIN CONDITIONING',
        'HUMECTANT',
      ]);
      expect(patterns).toHaveLength(1);
      expect(patterns[0].id).toBe('FP_SC_H');
    });

    it('should handle case-insensitive search', () => {
      const patterns = manager.findByFunctions(['skin conditioning']);
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('getMostCommon', () => {
    it('should return most common patterns', () => {
      const patterns = manager.getMostCommon(2);
      expect(patterns).toHaveLength(2);
      expect(patterns[0].usage_frequency).toBeGreaterThanOrEqual(
        patterns[1].usage_frequency
      );
    });

    it('should return all patterns if limit exceeds total', () => {
      const patterns = manager.getMostCommon(100);
      expect(patterns).toHaveLength(4);
    });
  });

  describe('findByComplexity', () => {
    it('should find patterns within complexity range', () => {
      const patterns = manager.findByComplexity(2, 3);
      expect(patterns.length).toBeGreaterThan(0);
      expect(
        patterns.every((p) => p.complexity_score >= 2 && p.complexity_score <= 3)
      ).toBe(true);
    });

    it('should return empty array for invalid range', () => {
      const patterns = manager.findByComplexity(100, 200);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('getSimplePatterns', () => {
    it('should return simple patterns with high frequency', () => {
      const patterns = manager.getSimplePatterns(10);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every((p) => p.complexity_score <= 3)).toBe(true);
    });
  });

  describe('findByApplication', () => {
    it('should find patterns by application type', () => {
      const patterns = manager.findByApplication('moisturizer');
      expect(patterns.length).toBeGreaterThan(0);
      expect(
        patterns.every((p) =>
          p.typical_applications.some((app) =>
            app.toLowerCase().includes('moisturizer')
          )
        )
      ).toBe(true);
    });

    it('should handle case-insensitive search', () => {
      const patterns = manager.findByApplication('SERUM');
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('suggestFormulationTemplate', () => {
    it('should return a complete formulation template', () => {
      const template = manager.suggestFormulationTemplate('moisturizer');

      expect(template).toHaveProperty('base');
      expect(template).toHaveProperty('emulsification');
      expect(template).toHaveProperty('actives');
      expect(template).toHaveProperty('preservation');
      expect(template).toHaveProperty('sensory');

      expect(Array.isArray(template.actives)).toBe(true);
      expect(Array.isArray(template.preservation)).toBe(true);
    });
  });

  describe('getAtomicFunction', () => {
    it('should retrieve atomic function data', () => {
      const func = manager.getAtomicFunction('SKIN CONDITIONING');
      expect(func).toBeDefined();
      expect(func?.name).toBe('SKIN CONDITIONING');
      expect(func?.count).toBe(1000);
    });

    it('should return undefined for non-existent function', () => {
      const func = manager.getAtomicFunction('NON_EXISTENT');
      expect(func).toBeUndefined();
    });
  });

  describe('findRelatedPatterns', () => {
    it('should find patterns related to a given pattern', () => {
      const related = manager.findRelatedPatterns('FP_SC', 5);
      expect(related.length).toBeGreaterThan(0);
      expect(related.every((p) => p.id !== 'FP_SC')).toBe(true);
    });

    it('should return empty array for non-existent pattern', () => {
      const related = manager.findRelatedPatterns('NON_EXISTENT', 5);
      expect(related).toHaveLength(0);
    });
  });

  describe('checkCompatibility', () => {
    it('should validate compatible patterns', () => {
      const result = manager.checkCompatibility(['FP_SC', 'FP_AM']);
      expect(result).toHaveProperty('compatible');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should detect concentration overflow', () => {
      // Create patterns that exceed 100% total concentration
      const result = manager.checkCompatibility([
        'FP_SC',
        'FP_SC_H',
        'FP_AM',
        'FP_SE',
      ]);
      // Total max: 10 + 15 + 2 + 5 = 32% (within range)
      expect(result.compatible).toBe(true);
    });

    it('should suggest adding preservation if missing', () => {
      const result = manager.checkCompatibility(['FP_SC', 'FP_SE']);
      expect(
        result.suggestions.some((s) =>
          s.toLowerCase().includes('preservation')
        )
      ).toBe(true);
    });
  });

  describe('generateFormulationReport', () => {
    it('should generate a comprehensive formulation report', () => {
      const report = manager.generateFormulationReport(['FP_SC', 'FP_AM']);

      expect(report).toHaveProperty('patterns');
      expect(report).toHaveProperty('total_functions');
      expect(report).toHaveProperty('categories');
      expect(report).toHaveProperty('concentration_range');
      expect(report).toHaveProperty('compatibility_check');
      expect(report).toHaveProperty('recommended_ingredients');

      expect(report.patterns).toHaveLength(2);
      expect(report.total_functions).toBeGreaterThan(0);
      expect(report.categories instanceof Map).toBe(true);
    });

    it('should calculate correct concentration ranges', () => {
      const report = manager.generateFormulationReport(['FP_SC', 'FP_AM']);
      expect(report.concentration_range.min).toBeGreaterThan(0);
      expect(report.concentration_range.max).toBeGreaterThan(
        report.concentration_range.min
      );
    });
  });

  describe('search', () => {
    it('should search patterns by keyword', () => {
      const results = manager.search('conditioning');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search in pattern names', () => {
      const results = manager.search('skin');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search in applications', () => {
      const results = manager.search('serum');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive search', () => {
      const results = manager.search('MOISTURIZER');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getTotalPatterns', () => {
    it('should return correct total number of patterns', () => {
      const total = manager.getTotalPatterns();
      expect(total).toBe(4);
    });
  });

  describe('getCategorySummary', () => {
    it('should return summary of patterns by category', () => {
      const summary = manager.getCategorySummary();
      expect(summary instanceof Map).toBe(true);
      expect(summary.get(PatternCategory.ACTIVE_DELIVERY)).toBe(2);
      expect(summary.get(PatternCategory.PRESERVATION)).toBe(1);
      expect(summary.get(PatternCategory.EMULSIFICATION)).toBe(1);
    });
  });
});

describe('formatPattern', () => {
  it('should format a pattern for display', () => {
    const pattern: FormulationPattern = {
      id: 'FP_TEST',
      name: 'TEST PATTERN',
      functions: ['FUNCTION_1', 'FUNCTION_2'],
      function_count: 2,
      typical_applications: ['Application 1', 'Application 2'],
      ingredient_examples: ['Ingredient A', 'Ingredient B', 'Ingredient C'],
      usage_frequency: 100,
      complexity_score: 5,
      category: PatternCategory.ACTIVE_DELIVERY,
      recommended_concentration_range: { min: 1.0, max: 5.0 },
      synergistic_patterns: [],
      incompatible_patterns: [],
    };

    const formatted = formatPattern(pattern);
    expect(formatted).toContain('FP_TEST');
    expect(formatted).toContain('TEST PATTERN');
    expect(formatted).toContain('FUNCTION_1');
    expect(formatted).toContain('100 ingredients');
    expect(formatted).toContain('5/10');
    expect(formatted).toContain('1% - 5%');
  });
});

describe('PATTERN_CATEGORIES', () => {
  it('should export all pattern categories', () => {
    expect(PATTERN_CATEGORIES).toHaveLength(6);
    expect(
      PATTERN_CATEGORIES.every((cat) => cat.value && cat.label && cat.description)
    ).toBe(true);
  });

  it('should include all category types', () => {
    const values = PATTERN_CATEGORIES.map((cat) => cat.value);
    expect(values).toContain(PatternCategory.BASE_FORMING);
    expect(values).toContain(PatternCategory.EMULSIFICATION);
    expect(values).toContain(PatternCategory.ACTIVE_DELIVERY);
    expect(values).toContain(PatternCategory.PRESERVATION);
    expect(values).toContain(PatternCategory.SENSORY_ENHANCEMENT);
    expect(values).toContain(PatternCategory.FUNCTIONAL_SPECIALTY);
  });
});
