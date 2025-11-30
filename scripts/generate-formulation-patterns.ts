#!/usr/bin/env node
/**
 * Generate Functional Formulation Patterns from COSING Functions
 * 
 * This script analyzes the COSING ingredients database to extract all unique
 * functional combinations and generate comprehensive formulation patterns that
 * can be used for intelligent product development.
 * 
 * SKIN-TWIN Cosmetic Formulation Intelligence Agent
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);

// ============================================================================
// Type Definitions
// ============================================================================

interface COSINGIngredient {
  cosing_ref_no: number;
  inci_name: string;
  inn_name: string | null;
  ph_eur_name: string | null;
  cas_no: string | null;
  ec_no: string | null;
  chem_iupac_name___description: string;
  restriction: string | null;
  function: string;
  update_date: string;
}

interface AtomicFunction {
  name: string;
  count: number; // How many times it appears in the dataset
  ingredients: string[]; // Sample INCI names using this function
}

interface FunctionCombination {
  functions: string[];
  count: number; // How many ingredients have this exact combination
  ingredients: string[]; // Sample INCI names
  pattern_id: string; // Unique identifier
}

interface FormulationPattern {
  id: string;
  name: string;
  functions: string[];
  function_count: number;
  typical_applications: string[];
  ingredient_examples: string[];
  usage_frequency: number; // How common this pattern is
  complexity_score: number; // 1-10 based on function interactions
  category: PatternCategory;
  recommended_concentration_range: {
    min: number;
    max: number;
  };
  synergistic_patterns: string[]; // IDs of compatible patterns
  incompatible_patterns: string[]; // IDs of incompatible patterns
}

enum PatternCategory {
  BASE_FORMING = 'BASE_FORMING', // Water, solvents, bulk ingredients
  EMULSIFICATION = 'EMULSIFICATION', // Emulsifiers, stabilizers
  ACTIVE_DELIVERY = 'ACTIVE_DELIVERY', // Skin conditioning, treatment
  PRESERVATION = 'PRESERVATION', // Antimicrobial, antioxidant
  SENSORY_ENHANCEMENT = 'SENSORY_ENHANCEMENT', // Texture, fragrance, color
  FUNCTIONAL_SPECIALTY = 'FUNCTIONAL_SPECIALTY', // Specific functions like UV, cleansing
}

interface PatternAnalysisResult {
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

// ============================================================================
// Core Analysis Functions
// ============================================================================

/**
 * Load and parse COSING ingredients from compressed JSON
 */
async function loadCOSINGData(): Promise<COSINGIngredient[]> {
  const cosingPath = path.join(
    process.cwd(),
    'vessels',
    'cosing',
    'cosing_ingredients.json.gz'
  );

  try {
    console.log('📦 Loading COSING database...');
    const compressed = await fs.promises.readFile(cosingPath);
    const decompressed = await gunzip(compressed);
    const data = JSON.parse(decompressed.toString());
    console.log(`✅ Loaded ${data.length} ingredients from COSING database`);
    return data;
  } catch (error) {
    console.error('❌ Error loading COSING data:', error);
    throw error;
  }
}

/**
 * Extract atomic functions from comma-separated function strings
 */
function extractAtomicFunctions(
  ingredients: COSINGIngredient[]
): Map<string, AtomicFunction> {
  const functionMap = new Map<string, AtomicFunction>();

  ingredients.forEach((ingredient) => {
    if (!ingredient.function) return;

    const functions = ingredient.function
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f && f !== 'null' && f !== 'NOT REPORTED');

    functions.forEach((func) => {
      if (!functionMap.has(func)) {
        functionMap.set(func, {
          name: func,
          count: 0,
          ingredients: [],
        });
      }

      const funcData = functionMap.get(func)!;
      funcData.count++;
      if (funcData.ingredients.length < 5) {
        funcData.ingredients.push(ingredient.inci_name);
      }
    });
  });

  console.log(`🔬 Extracted ${functionMap.size} unique atomic functions`);
  return functionMap;
}

/**
 * Extract all unique function combinations
 */
function extractFunctionCombinations(
  ingredients: COSINGIngredient[]
): Map<string, FunctionCombination> {
  const combinationMap = new Map<string, FunctionCombination>();

  ingredients.forEach((ingredient) => {
    if (!ingredient.function) return;

    const functions = ingredient.function
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f && f !== 'null' && f !== 'NOT REPORTED')
      .sort(); // Sort for consistent pattern IDs

    if (functions.length === 0) return;

    const patternId = functions.join(' + ');

    if (!combinationMap.has(patternId)) {
      combinationMap.set(patternId, {
        functions,
        count: 0,
        ingredients: [],
        pattern_id: generatePatternId(functions),
      });
    }

    const combo = combinationMap.get(patternId)!;
    combo.count++;
    if (combo.ingredients.length < 3) {
      combo.ingredients.push(ingredient.inci_name);
    }
  });

  console.log(`🧩 Found ${combinationMap.size} unique function combinations`);
  return combinationMap;
}

/**
 * Generate a short, readable pattern ID
 */
function generatePatternId(functions: string[]): string {
  const abbreviations = functions.map((f) => {
    const words = f.split(/[\s-]+/);
    if (words.length === 1) {
      return f.substring(0, 3).toUpperCase();
    }
    return words
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 4);
  });

  return `FP_${abbreviations.join('_')}`;
}

/**
 * Categorize a pattern based on its functions
 */
function categorizePattern(functions: string[]): PatternCategory {
  const funcSet = new Set(functions.map((f) => f.toUpperCase()));

  // Base forming - solvents, bulk ingredients
  if (
    funcSet.has('SOLVENT') ||
    funcSet.has('BULKING') ||
    funcSet.has('VISCOSITY CONTROLLING')
  ) {
    return PatternCategory.BASE_FORMING;
  }

  // Emulsification
  if (
    Array.from(funcSet).some(
      (f) =>
        f.includes('SURFACTANT') ||
        f.includes('EMULSIFYING') ||
        f.includes('EMULSION STABILISING')
    )
  ) {
    return PatternCategory.EMULSIFICATION;
  }

  // Active delivery
  if (
    Array.from(funcSet).some(
      (f) =>
        f.includes('SKIN CONDITIONING') ||
        f.includes('HAIR CONDITIONING') ||
        f.includes('HUMECTANT') ||
        f.includes('MOISTURISING')
    )
  ) {
    return PatternCategory.ACTIVE_DELIVERY;
  }

  // Preservation
  if (
    funcSet.has('ANTIMICROBIAL') ||
    funcSet.has('PRESERVATIVE') ||
    funcSet.has('ANTIOXIDANT')
  ) {
    return PatternCategory.PRESERVATION;
  }

  // Sensory enhancement
  if (
    funcSet.has('PERFUMING') ||
    funcSet.has('FRAGRANCE') ||
    funcSet.has('COLORANT') ||
    funcSet.has('OPACIFYING')
  ) {
    return PatternCategory.SENSORY_ENHANCEMENT;
  }

  // Functional specialty
  return PatternCategory.FUNCTIONAL_SPECIALTY;
}

/**
 * Estimate typical applications for a function pattern
 */
function estimateApplications(functions: string[]): string[] {
  const applications: string[] = [];
  const funcSet = new Set(functions.map((f) => f.toUpperCase()));

  if (
    Array.from(funcSet).some((f) => f.includes('SKIN CONDITIONING')) ||
    funcSet.has('MOISTURISING')
  ) {
    applications.push('Moisturizers', 'Serums', 'Creams');
  }

  if (Array.from(funcSet).some((f) => f.includes('CLEANSING'))) {
    applications.push('Cleansers', 'Shampoos', 'Body Wash');
  }

  if (funcSet.has('UV ABSORBER') || funcSet.has('UV FILTER')) {
    applications.push('Sunscreens', 'Day Creams', 'BB Creams');
  }

  if (Array.from(funcSet).some((f) => f.includes('HAIR'))) {
    applications.push('Hair Care', 'Conditioners', 'Hair Masks');
  }

  if (funcSet.has('EXFOLIATING') || funcSet.has('KERATOLYTIC')) {
    applications.push('Exfoliants', 'Peels', 'Scrubs');
  }

  if (funcSet.has('ANTIMICROBIAL') || funcSet.has('PRESERVATIVE')) {
    applications.push('All Products (Preservation System)');
  }

  if (applications.length === 0) {
    applications.push('Specialty Formulations');
  }

  return applications;
}

/**
 * Calculate complexity score for a pattern
 */
function calculateComplexityScore(functions: string[]): number {
  let score = 0;

  // Base score on number of functions
  score += Math.min(functions.length, 5);

  // Add complexity for specialized functions
  const specializedFunctions = [
    'UV ABSORBER',
    'HAIR DYEING',
    'DEPILATORY',
    'HAIR WAVING OR STRAIGHTENING',
    'CHELATING',
  ];

  specializedFunctions.forEach((sf) => {
    if (functions.some((f) => f.includes(sf))) {
      score += 2;
    }
  });

  // Cap at 10
  return Math.min(score, 10);
}

/**
 * Estimate typical concentration range
 */
function estimateConcentrationRange(functions: string[]): {
  min: number;
  max: number;
} {
  const funcSet = new Set(functions.map((f) => f.toUpperCase()));

  // Actives and preservatives - low concentration
  if (
    funcSet.has('PRESERVATIVE') ||
    funcSet.has('ANTIMICROBIAL') ||
    funcSet.has('ANTIOXIDANT')
  ) {
    return { min: 0.01, max: 2.0 };
  }

  // UV filters - moderate
  if (funcSet.has('UV ABSORBER') || funcSet.has('UV FILTER')) {
    return { min: 2.0, max: 10.0 };
  }

  // Emulsifiers - moderate
  if (Array.from(funcSet).some((f) => f.includes('SURFACTANT'))) {
    return { min: 0.5, max: 5.0 };
  }

  // Conditioning agents - variable
  if (Array.from(funcSet).some((f) => f.includes('CONDITIONING'))) {
    return { min: 0.5, max: 10.0 };
  }

  // Bulk ingredients
  if (funcSet.has('SOLVENT') || funcSet.has('BULKING')) {
    return { min: 10.0, max: 80.0 };
  }

  // Default range
  return { min: 0.1, max: 5.0 };
}

/**
 * Generate formulation patterns from combinations
 */
function generateFormulationPatterns(
  combinations: Map<string, FunctionCombination>
): FormulationPattern[] {
  const patterns: FormulationPattern[] = [];

  combinations.forEach((combo) => {
    const pattern: FormulationPattern = {
      id: combo.pattern_id,
      name: combo.functions.join(' + '),
      functions: combo.functions,
      function_count: combo.functions.length,
      typical_applications: estimateApplications(combo.functions),
      ingredient_examples: combo.ingredients,
      usage_frequency: combo.count,
      complexity_score: calculateComplexityScore(combo.functions),
      category: categorizePattern(combo.functions),
      recommended_concentration_range: estimateConcentrationRange(
        combo.functions
      ),
      synergistic_patterns: [],
      incompatible_patterns: [],
    };

    patterns.push(pattern);
  });

  // Sort by usage frequency (most common first)
  patterns.sort((a, b) => b.usage_frequency - a.usage_frequency);

  console.log(`✨ Generated ${patterns.length} formulation patterns`);
  return patterns;
}

/**
 * Calculate statistics for the analysis
 */
function calculateStatistics(
  ingredients: COSINGIngredient[],
  atomicFunctions: Map<string, AtomicFunction>,
  combinations: Map<string, FunctionCombination>,
  patterns: FormulationPattern[]
): PatternAnalysisResult['statistics'] {
  // Find most common function
  let mostCommon = '';
  let maxCount = 0;
  atomicFunctions.forEach((func) => {
    if (func.count > maxCount) {
      maxCount = func.count;
      mostCommon = func.name;
    }
  });

  // Find most complex combination
  let mostComplex: string[] = [];
  combinations.forEach((combo) => {
    if (combo.functions.length > mostComplex.length) {
      mostComplex = combo.functions;
    }
  });

  // Calculate average functions per ingredient
  const totalFunctions = Array.from(combinations.values()).reduce(
    (sum, combo) => sum + combo.count * combo.functions.length,
    0
  );
  const avgFunctions = totalFunctions / ingredients.length;

  return {
    total_ingredients: ingredients.length,
    total_atomic_functions: atomicFunctions.size,
    total_combinations: combinations.size,
    total_patterns_generated: patterns.length,
    most_common_function: mostCommon,
    most_complex_combination: mostComplex,
    average_functions_per_ingredient: Math.round(avgFunctions * 100) / 100,
  };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🧪 SKIN-TWIN Formulation Pattern Generator');
  console.log('==========================================\n');

  try {
    // Load COSING data
    const ingredients = await loadCOSINGData();

    // Extract atomic functions
    const atomicFunctions = extractAtomicFunctions(ingredients);
    const atomicFunctionsArray = Array.from(atomicFunctions.values()).sort(
      (a, b) => b.count - a.count
    );

    // Extract function combinations
    const combinations = extractFunctionCombinations(ingredients);

    // Generate formulation patterns
    const patterns = generateFormulationPatterns(combinations);

    // Calculate statistics
    const statistics = calculateStatistics(
      ingredients,
      atomicFunctions,
      combinations,
      patterns
    );

    // Prepare output
    const result: PatternAnalysisResult = {
      atomic_functions: atomicFunctionsArray,
      function_combinations: Array.from(combinations.values()).sort(
        (a, b) => b.count - a.count
      ),
      formulation_patterns: patterns,
      statistics,
    };

    // Save results
    const outputPath = path.join(
      process.cwd(),
      'vessels',
      'cosing',
      'formulation_patterns.json'
    );

    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(result, null, 2),
      'utf-8'
    );

    console.log(`\n📊 Analysis Complete!`);
    console.log('====================\n');
    console.log(`Total Ingredients: ${statistics.total_ingredients}`);
    console.log(`Atomic Functions: ${statistics.total_atomic_functions}`);
    console.log(`Function Combinations: ${statistics.total_combinations}`);
    console.log(`Formulation Patterns: ${statistics.total_patterns_generated}`);
    console.log(`Most Common Function: ${statistics.most_common_function}`);
    console.log(
      `Average Functions/Ingredient: ${statistics.average_functions_per_ingredient}`
    );
    console.log(
      `Most Complex Combination: ${statistics.most_complex_combination.length} functions`
    );
    console.log(`\n💾 Results saved to: ${outputPath}`);

    // Generate summary by category
    console.log('\n📈 Patterns by Category:');
    const byCategory = new Map<PatternCategory, number>();
    patterns.forEach((p) => {
      byCategory.set(p.category, (byCategory.get(p.category) || 0) + 1);
    });
    byCategory.forEach((count, category) => {
      console.log(`  ${category}: ${count} patterns`);
    });

    // Show top 10 most common patterns
    console.log('\n🔝 Top 10 Most Common Patterns:');
    patterns.slice(0, 10).forEach((p, i) => {
      console.log(
        `  ${i + 1}. ${p.name} (${p.usage_frequency} ingredients)`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateFormulationPatterns, extractAtomicFunctions, extractFunctionCombinations };
