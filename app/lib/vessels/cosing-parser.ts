/**
 * COSING Database Parser
 * Integrates European Cosmetic Ingredients Database with SKIN-TWIN
 */

import type { FormulationSchema } from '~/types/vessels';

export interface COSINGIngredient {
  id: number;
  name: string;
  inci_name: string;
  cas_number: string;
  function: string;
  molecular_weight?: number;
  solubility?: string;
  concentration_min: number;
  concentration_max: number;
  safety_profile?: string;
  price_per_100g?: number;
  stability_ph_min?: number;
  stability_ph_max?: number;
  temperature_stability?: number;
  incompatibilities: string[];
  benefits: string[];
  phase?: string;
  is_natural: boolean;
  is_restricted: boolean;
  is_gras: boolean;
}

export interface IngredientEnhancement {
  inciName: string;
  cosing: COSINGIngredient;
  recommendations: {
    optimalConcentration: number;
    suggestedFunction: string;
    compatibleIngredients: string[];
    restrictions: string[];
  };
}

/**
 * Parse COSING JSON data
 */
export function parseCOSINGData(jsonContent: string): COSINGIngredient[] {
  try {
    const data = JSON.parse(jsonContent);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error parsing COSING data:', error);
    return [];
  }
}

/**
 * Find COSING ingredient by INCI name
 */
export function findIngredientByINCI(
  ingredients: COSINGIngredient[],
  inciName: string
): COSINGIngredient | undefined {
  const normalizedName = normalizeINCI(inciName);
  return ingredients.find(
    ing => normalizeINCI(ing.inci_name) === normalizedName
  );
}

/**
 * Find COSING ingredient by CAS number
 */
export function findIngredientByCAS(
  ingredients: COSINGIngredient[],
  casNumber: string
): COSINGIngredient | undefined {
  return ingredients.find(ing => {
    const casList = ing.cas_number.split('/').map(s => s.trim());
    return casList.includes(casNumber.trim());
  });
}

/**
 * Enhance formulation with COSING data
 */
export function enhanceFormulationWithCOSING(
  formulation: Partial<FormulationSchema>,
  cosingDatabase: COSINGIngredient[]
): {
  enhanced: Partial<FormulationSchema>;
  enhancements: IngredientEnhancement[];
  warnings: string[];
} {
  const enhanced = { ...formulation };
  const enhancements: IngredientEnhancement[] = [];
  const warnings: string[] = [];
  
  // Process each ingredient
  if (enhanced.ingredients) {
    enhanced.ingredients = enhanced.ingredients.map(ingredient => {
      const cosingData = findIngredientByINCI(
        cosingDatabase,
        ingredient.ingredientId
      );
      
      if (cosingData) {
        // Check concentration limits
        if (ingredient.concentration > cosingData.concentration_max) {
          warnings.push(
            `${ingredient.ingredientId}: Concentration (${ingredient.concentration}%) exceeds COSING maximum (${cosingData.concentration_max}%)`
          );
        }
        
        if (ingredient.concentration < cosingData.concentration_min) {
          warnings.push(
            `${ingredient.ingredientId}: Concentration (${ingredient.concentration}%) below COSING minimum (${cosingData.concentration_min}%)`
          );
        }
        
        // Check restrictions
        if (cosingData.is_restricted) {
          warnings.push(
            `${ingredient.ingredientId}: This ingredient has regulatory restrictions`
          );
        }
        
        // Create enhancement record
        enhancements.push({
          inciName: ingredient.ingredientId,
          cosing: cosingData,
          recommendations: {
            optimalConcentration: (cosingData.concentration_min + cosingData.concentration_max) / 2,
            suggestedFunction: cosingData.function,
            compatibleIngredients: [],
            restrictions: cosingData.is_restricted ? ['Check regulatory compliance'] : []
          }
        });
        
        // Update ingredient with enhanced data
        return {
          ...ingredient,
          concentrationRange: {
            min: cosingData.concentration_min,
            max: cosingData.concentration_max
          },
          notes: `${ingredient.notes || ''} | COSING Function: ${cosingData.function}${
            cosingData.is_natural ? ' | Natural' : ''
          }${cosingData.is_gras ? ' | GRAS' : ''}`
        };
      }
      
      return ingredient;
    });
  }
  
  // Update regulatory compliance
  if (enhanced.regulatory && warnings.some(w => w.includes('restrictions'))) {
    enhanced.regulatory = {
      ...enhanced.regulatory,
      compliance: [...(enhanced.regulatory.compliance || []), 'COSING Review Required']
    };
  }
  
  // Add COSING validation tag
  if (enhanced.tags) {
    enhanced.tags = [...enhanced.tags, 'cosing-validated'];
  }
  
  return {
    enhanced,
    enhancements,
    warnings
  };
}

/**
 * Generate ingredient compatibility matrix
 */
export function generateCompatibilityMatrix(
  ingredients: COSINGIngredient[]
): Record<string, Record<string, 'compatible' | 'incompatible' | 'unknown'>> {
  const matrix: Record<string, Record<string, 'compatible' | 'incompatible' | 'unknown'>> = {};
  
  ingredients.forEach(ing1 => {
    matrix[ing1.inci_name] = {};
    
    ingredients.forEach(ing2 => {
      if (ing1.id === ing2.id) {
        matrix[ing1.inci_name][ing2.inci_name] = 'compatible';
      } else {
        // Check known incompatibilities
        const isIncompatible = 
          ing1.incompatibilities.includes(ing2.inci_name) ||
          ing2.incompatibilities.includes(ing1.inci_name);
        
        matrix[ing1.inci_name][ing2.inci_name] = isIncompatible ? 'incompatible' : 'unknown';
      }
    });
  });
  
  return matrix;
}

/**
 * Suggest ingredient alternatives
 */
export function suggestAlternatives(
  ingredient: COSINGIngredient,
  database: COSINGIngredient[]
): COSINGIngredient[] {
  return database.filter(alt => {
    return (
      alt.id !== ingredient.id &&
      alt.function === ingredient.function &&
      Math.abs(alt.concentration_max - ingredient.concentration_max) < 2 &&
      alt.is_restricted === false
    );
  }).slice(0, 5); // Return top 5 alternatives
}

/**
 * Calculate formulation safety score
 */
export function calculateSafetyScore(
  formulation: Partial<FormulationSchema>,
  cosingDatabase: COSINGIngredient[]
): {
  score: number;
  details: {
    restrictedIngredients: string[];
    concentrationIssues: string[];
    naturalPercentage: number;
    grasPercentage: number;
  };
} {
  let score = 100;
  const restrictedIngredients: string[] = [];
  const concentrationIssues: string[] = [];
  let naturalCount = 0;
  let grasCount = 0;
  let totalIngredients = 0;
  
  if (formulation.ingredients) {
    totalIngredients = formulation.ingredients.length;
    
    formulation.ingredients.forEach(ingredient => {
      const cosingData = findIngredientByINCI(cosingDatabase, ingredient.ingredientId);
      
      if (cosingData) {
        // Check restrictions
        if (cosingData.is_restricted) {
          restrictedIngredients.push(ingredient.ingredientId);
          score -= 10;
        }
        
        // Check concentration compliance
        if (ingredient.concentration > cosingData.concentration_max) {
          concentrationIssues.push(
            `${ingredient.ingredientId}: exceeds max concentration`
          );
          score -= 5;
        }
        
        if (ingredient.concentration < cosingData.concentration_min) {
          concentrationIssues.push(
            `${ingredient.ingredientId}: below min concentration`
          );
          score -= 3;
        }
        
        // Count natural and GRAS ingredients
        if (cosingData.is_natural) naturalCount++;
        if (cosingData.is_gras) grasCount++;
      }
    });
  }
  
  const naturalPercentage = totalIngredients > 0 
    ? (naturalCount / totalIngredients) * 100 
    : 0;
  
  const grasPercentage = totalIngredients > 0 
    ? (grasCount / totalIngredients) * 100 
    : 0;
  
  // Bonus for high natural content
  if (naturalPercentage > 70) score += 5;
  if (grasPercentage > 50) score += 3;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    details: {
      restrictedIngredients,
      concentrationIssues,
      naturalPercentage,
      grasPercentage
    }
  };
}

// Helper functions
function normalizeINCI(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/**
 * Create ingredient reference lookup
 */
export function createIngredientLookup(
  ingredients: COSINGIngredient[]
): Map<string, COSINGIngredient> {
  const lookup = new Map<string, COSINGIngredient>();
  
  ingredients.forEach(ingredient => {
    // Add by INCI name
    lookup.set(normalizeINCI(ingredient.inci_name), ingredient);
    
    // Add by CAS numbers
    if (ingredient.cas_number) {
      ingredient.cas_number.split('/').forEach(cas => {
        lookup.set(cas.trim(), ingredient);
      });
    }
  });
  
  return lookup;
}

/**
 * Export COSING data summary
 */
export function exportCOSINGSummary(database: COSINGIngredient[]): {
  totalIngredients: number;
  byFunction: Record<string, number>;
  naturalIngredients: number;
  restrictedIngredients: number;
  grasIngredients: number;
} {
  const byFunction: Record<string, number> = {};
  
  database.forEach(ingredient => {
    byFunction[ingredient.function] = (byFunction[ingredient.function] || 0) + 1;
  });
  
  return {
    totalIngredients: database.length,
    byFunction,
    naturalIngredients: database.filter(i => i.is_natural).length,
    restrictedIngredients: database.filter(i => i.is_restricted).length,
    grasIngredients: database.filter(i => i.is_gras).length
  };
}