/**
 * Formulation Pattern Analysis and Utilities
 * 
 * This module provides utilities to work with COSING-based formulation patterns,
 * enabling intelligent ingredient selection and formulation optimization.
 * 
 * SKIN-TWIN Cosmetic Formulation Intelligence Agent
 */

export enum PatternCategory {
  BASE_FORMING = 'BASE_FORMING',
  EMULSIFICATION = 'EMULSIFICATION',
  ACTIVE_DELIVERY = 'ACTIVE_DELIVERY',
  PRESERVATION = 'PRESERVATION',
  SENSORY_ENHANCEMENT = 'SENSORY_ENHANCEMENT',
  FUNCTIONAL_SPECIALTY = 'FUNCTIONAL_SPECIALTY',
}

export interface AtomicFunction {
  name: string;
  count: number;
  ingredients: string[];
}

export interface FunctionCombination {
  functions: string[];
  count: number;
  ingredients: string[];
  pattern_id: string;
}

export interface FormulationPattern {
  id: string;
  name: string;
  functions: string[];
  function_count: number;
  typical_applications: string[];
  ingredient_examples: string[];
  usage_frequency: number;
  complexity_score: number;
  category: PatternCategory;
  recommended_concentration_range: {
    min: number;
    max: number;
  };
  synergistic_patterns: string[];
  incompatible_patterns: string[];
}

export interface PatternAnalysisResult {
  atomic_functions: AtomicFunction[];
  function_combinations: FunctionCombination[];
  formulation_patterns: FormulationPattern[];
  statistics: {
    total_ingredients: number;
    total_atomic_functions: number;
    total_combinations: number;
    total_patterns_generated: number;
    most_common_function: string;
    most_complex_combination: string[];
    average_functions_per_ingredient: number;
  };
}

/**
 * Pattern search and filtering utilities
 */
export class FormulationPatternManager {
  private patterns: FormulationPattern[];
  private atomicFunctions: Map<string, AtomicFunction>;

  constructor(data: PatternAnalysisResult) {
    this.patterns = data.formulation_patterns;
    this.atomicFunctions = new Map(
      data.atomic_functions.map((f) => [f.name, f])
    );
  }

  /**
   * Find patterns by category
   */
  findByCategory(category: PatternCategory): FormulationPattern[] {
    return this.patterns.filter((p) => p.category === category);
  }

  /**
   * Find patterns containing specific functions
   */
  findByFunctions(functions: string[]): FormulationPattern[] {
    const normalizedSearchFuncs = functions.map((f) => f.toUpperCase());

    return this.patterns.filter((p) => {
      const patternFuncs = p.functions.map((f) => f.toUpperCase());
      return normalizedSearchFuncs.every((sf) =>
        patternFuncs.some((pf) => pf.includes(sf))
      );
    });
  }

  /**
   * Find most common patterns (top N)
   */
  getMostCommon(limit: number = 10): FormulationPattern[] {
    return this.patterns.slice(0, limit);
  }

  /**
   * Find patterns by complexity range
   */
  findByComplexity(
    minScore: number,
    maxScore: number
  ): FormulationPattern[] {
    return this.patterns.filter(
      (p) => p.complexity_score >= minScore && p.complexity_score <= maxScore
    );
  }

  /**
   * Find simple patterns (low complexity, high frequency)
   */
  getSimplePatterns(limit: number = 20): FormulationPattern[] {
    return this.patterns
      .filter((p) => p.complexity_score <= 3 && p.usage_frequency > 50)
      .slice(0, limit);
  }

  /**
   * Find patterns suitable for specific product types
   */
  findByApplication(application: string): FormulationPattern[] {
    const normalizedApp = application.toLowerCase();
    return this.patterns.filter((p) =>
      p.typical_applications.some((app) =>
        app.toLowerCase().includes(normalizedApp)
      )
    );
  }

  /**
   * Get patterns for building a complete formulation
   */
  suggestFormulationTemplate(productType: string): {
    base: FormulationPattern[];
    emulsification: FormulationPattern[];
    actives: FormulationPattern[];
    preservation: FormulationPattern[];
    sensory: FormulationPattern[];
  } {
    const base = this.findByCategory(PatternCategory.BASE_FORMING).slice(0, 3);
    const emulsification = this.findByCategory(
      PatternCategory.EMULSIFICATION
    ).slice(0, 3);
    const actives = this.findByCategory(PatternCategory.ACTIVE_DELIVERY)
      .filter((p) =>
        p.typical_applications.some((app) =>
          app.toLowerCase().includes(productType.toLowerCase())
        )
      )
      .slice(0, 5);
    const preservation = this.findByCategory(
      PatternCategory.PRESERVATION
    ).slice(0, 2);
    const sensory = this.findByCategory(
      PatternCategory.SENSORY_ENHANCEMENT
    ).slice(0, 2);

    return {
      base,
      emulsification,
      actives,
      preservation,
      sensory,
    };
  }

  /**
   * Get atomic function statistics
   */
  getAtomicFunction(name: string): AtomicFunction | undefined {
    return this.atomicFunctions.get(name);
  }

  /**
   * Find related patterns (patterns sharing functions)
   */
  findRelatedPatterns(
    patternId: string,
    limit: number = 5
  ): FormulationPattern[] {
    const pattern = this.patterns.find((p) => p.id === patternId);
    if (!pattern) return [];

    const patternFuncSet = new Set(pattern.functions);

    // Calculate similarity score for each pattern
    const scored = this.patterns
      .filter((p) => p.id !== patternId)
      .map((p) => {
        const commonFunctions = p.functions.filter((f) =>
          patternFuncSet.has(f)
        ).length;
        const totalUniqueFunctions =
          new Set([...p.functions, ...pattern.functions]).size;
        const similarity = commonFunctions / totalUniqueFunctions;

        return { pattern: p, similarity };
      })
      .filter((item) => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit).map((item) => item.pattern);
  }

  /**
   * Validate formulation pattern compatibility
   */
  checkCompatibility(patternIds: string[]): {
    compatible: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const patterns = patternIds
      .map((id) => this.patterns.find((p) => p.id === id))
      .filter((p): p is FormulationPattern => p !== undefined);

    const warnings: string[] = [];
    const suggestions: string[] = [];
    let compatible = true;

    // Check for duplicate functions
    const allFunctions: string[] = [];
    patterns.forEach((p) => {
      p.functions.forEach((f) => {
        if (allFunctions.includes(f)) {
          warnings.push(`Duplicate function detected: ${f}`);
        }
        allFunctions.push(f);
      });
    });

    // Check concentration ranges
    const totalMinConcentration = patterns.reduce(
      (sum, p) => sum + p.recommended_concentration_range.min,
      0
    );
    const totalMaxConcentration = patterns.reduce(
      (sum, p) => sum + p.recommended_concentration_range.max,
      0
    );

    if (totalMaxConcentration > 100) {
      warnings.push(
        `Total maximum concentration (${totalMaxConcentration.toFixed(1)}%) exceeds 100%`
      );
      suggestions.push('Adjust concentrations to stay within 100% total');
      compatible = false;
    }

    if (totalMinConcentration > 100) {
      warnings.push(
        `Total minimum concentration (${totalMinConcentration.toFixed(1)}%) exceeds 100%`
      );
      compatible = false;
    }

    // Check for missing categories
    const categories = new Set(patterns.map((p) => p.category));
    if (!categories.has(PatternCategory.PRESERVATION)) {
      suggestions.push('Consider adding a preservation system');
    }
    if (
      !categories.has(PatternCategory.BASE_FORMING) &&
      !categories.has(PatternCategory.EMULSIFICATION)
    ) {
      suggestions.push('Consider adding a base forming or emulsification pattern');
    }

    // Check complexity
    const avgComplexity =
      patterns.reduce((sum, p) => sum + p.complexity_score, 0) /
      patterns.length;
    if (avgComplexity > 7) {
      warnings.push(
        `High average complexity (${avgComplexity.toFixed(1)}/10) may indicate challenging formulation`
      );
      suggestions.push(
        'Consider simplifying by removing some specialized functions'
      );
    }

    return {
      compatible,
      warnings,
      suggestions,
    };
  }

  /**
   * Generate a formulation report for selected patterns
   */
  generateFormulationReport(patternIds: string[]): {
    patterns: FormulationPattern[];
    total_functions: number;
    categories: Map<PatternCategory, number>;
    concentration_range: { min: number; max: number };
    compatibility_check: ReturnType<typeof this.checkCompatibility>;
    recommended_ingredients: string[];
  } {
    const patterns = patternIds
      .map((id) => this.patterns.find((p) => p.id === id))
      .filter((p): p is FormulationPattern => p !== undefined);

    const allFunctions = new Set<string>();
    patterns.forEach((p) => p.functions.forEach((f) => allFunctions.add(f)));

    const categories = new Map<PatternCategory, number>();
    patterns.forEach((p) => {
      categories.set(p.category, (categories.get(p.category) || 0) + 1);
    });

    const totalMin = patterns.reduce(
      (sum, p) => sum + p.recommended_concentration_range.min,
      0
    );
    const totalMax = patterns.reduce(
      (sum, p) => sum + p.recommended_concentration_range.max,
      0
    );

    // Collect unique ingredient examples
    const ingredientSet = new Set<string>();
    patterns.forEach((p) => {
      p.ingredient_examples.forEach((ing) => ingredientSet.add(ing));
    });

    return {
      patterns,
      total_functions: allFunctions.size,
      categories,
      concentration_range: {
        min: Math.round(totalMin * 10) / 10,
        max: Math.round(totalMax * 10) / 10,
      },
      compatibility_check: this.checkCompatibility(patternIds),
      recommended_ingredients: Array.from(ingredientSet),
    };
  }

  /**
   * Search patterns by keyword
   */
  search(keyword: string): FormulationPattern[] {
    const normalizedKeyword = keyword.toLowerCase();

    return this.patterns.filter((p) => {
      // Search in pattern name
      if (p.name.toLowerCase().includes(normalizedKeyword)) return true;

      // Search in functions
      if (
        p.functions.some((f) => f.toLowerCase().includes(normalizedKeyword))
      )
        return true;

      // Search in applications
      if (
        p.typical_applications.some((app) =>
          app.toLowerCase().includes(normalizedKeyword)
        )
      )
        return true;

      return false;
    });
  }

  /**
   * Get total number of patterns
   */
  getTotalPatterns(): number {
    return this.patterns.length;
  }

  /**
   * Get all categories with counts
   */
  getCategorySummary(): Map<PatternCategory, number> {
    const summary = new Map<PatternCategory, number>();
    this.patterns.forEach((p) => {
      summary.set(p.category, (summary.get(p.category) || 0) + 1);
    });
    return summary;
  }
}

/**
 * Load formulation patterns from JSON file
 */
export async function loadFormulationPatterns(): Promise<FormulationPatternManager> {
  // This would be implemented to load from the JSON file
  // For now, it's a placeholder for the client-side implementation
  throw new Error(
    'loadFormulationPatterns must be implemented with file system access'
  );
}

/**
 * Helper function to format pattern for display
 */
export function formatPattern(pattern: FormulationPattern): string {
  return `
Pattern: ${pattern.name}
ID: ${pattern.id}
Category: ${pattern.category}
Functions: ${pattern.functions.join(', ')}
Usage Frequency: ${pattern.usage_frequency} ingredients
Complexity: ${pattern.complexity_score}/10
Concentration Range: ${pattern.recommended_concentration_range.min}% - ${pattern.recommended_concentration_range.max}%
Applications: ${pattern.typical_applications.join(', ')}
Example Ingredients: ${pattern.ingredient_examples.slice(0, 3).join(', ')}
  `.trim();
}

/**
 * Export pattern categories for use in UI
 */
export const PATTERN_CATEGORIES = [
  {
    value: PatternCategory.BASE_FORMING,
    label: 'Base Forming',
    description: 'Solvents, bulk ingredients, and viscosity modifiers',
  },
  {
    value: PatternCategory.EMULSIFICATION,
    label: 'Emulsification',
    description: 'Emulsifiers, surfactants, and stabilizers',
  },
  {
    value: PatternCategory.ACTIVE_DELIVERY,
    label: 'Active Delivery',
    description: 'Skin/hair conditioning and moisturizing agents',
  },
  {
    value: PatternCategory.PRESERVATION,
    label: 'Preservation',
    description: 'Antimicrobials, preservatives, and antioxidants',
  },
  {
    value: PatternCategory.SENSORY_ENHANCEMENT,
    label: 'Sensory Enhancement',
    description: 'Fragrances, colors, and texture modifiers',
  },
  {
    value: PatternCategory.FUNCTIONAL_SPECIALTY,
    label: 'Functional Specialty',
    description: 'UV filters, cleansers, and specialized functions',
  },
];
