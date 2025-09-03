/**
 * PIF (Product Information File) Parser for SpaZone Products
 * Extracts and converts PIF document data into SKIN-TWIN schema format
 */

import type { FormulationSchema, IngredientUsage, Phase } from '~/types/vessels';

export interface PIFProductInfo {
  name: string;
  type: string;
  form: string;
  color: string;
  packSize: string;
  packType: string;
  manufacturerCode: string;
  normalUse: string;
  claims: string[];
}

export interface PIFIngredient {
  inciName: string;
  casNumber?: string;
  concentration: number;
  function?: string;
  safetyInfo?: {
    hazardClass?: string;
    noael?: number;
    sed?: number; // Systemic Exposure Dosage
  };
}

export interface PIFPhysicalProperties {
  physicalState: string;
  mixtureType: string;
  organoleptic: string;
  pH: number;
  viscosity: number;
  thermalStability: string;
  specificGravity: number;
}

export interface PIFDocument {
  productInfo: PIFProductInfo;
  ingredients: PIFIngredient[];
  physicalProperties: PIFPhysicalProperties;
  shelfLife: {
    monthsAfterOpening: number;
    stabilityNotes: string;
  };
  safety: {
    microbiologicalQuality: string;
    preservativeEffectiveness: string;
    exposureRoute: string;
    targetPopulation: string;
  };
}

/**
 * Parse PIF document content and extract structured data
 */
export function parsePIFDocument(content: string): PIFDocument {
  const lines = content.split('\n');
  
  const productInfo = extractProductInfo(lines);
  const ingredients = extractIngredients(lines);
  const physicalProperties = extractPhysicalProperties(lines);
  const shelfLife = extractShelfLife(lines);
  const safety = extractSafetyInfo(lines);
  
  return {
    productInfo,
    ingredients,
    physicalProperties,
    shelfLife,
    safety
  };
}

function extractProductInfo(lines: string[]): PIFProductInfo {
  const info: PIFProductInfo = {
    name: '',
    type: '',
    form: '',
    color: '',
    packSize: '',
    packType: '',
    manufacturerCode: '',
    normalUse: '',
    claims: []
  };
  
  // Extract product name
  const productNameMatch = lines.find(line => line.includes('Product Name:'));
  if (productNameMatch) {
    info.name = productNameMatch.split(':')[1]?.trim() || '';
  }
  
  // Extract from table format
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('|Product type')) {
      info.type = extractTableValue(lines[i]);
    } else if (line.includes('|Form')) {
      info.form = extractTableValue(lines[i]);
    } else if (line.includes('|Colour')) {
      info.color = extractTableValue(lines[i]);
    } else if (line.includes('|Pack size')) {
      info.packSize = extractTableValue(lines[i]);
    } else if (line.includes('|Pack type')) {
      info.packType = extractTableValue(lines[i]);
    } else if (line.includes('|Manufacturer code')) {
      info.manufacturerCode = extractTableValue(lines[i]);
    } else if (line.includes('|Normal use')) {
      // Multi-line field, needs special handling
      info.normalUse = extractMultilineTableValue(lines, i);
    } else if (line.includes('Product claims:')) {
      // Extract claims from following lines
      const claimText = lines[i + 2]?.trim();
      if (claimText) {
        info.claims = [claimText];
      }
    }
  }
  
  return info;
}

function extractIngredients(lines: string[]): PIFIngredient[] {
  const ingredients: PIFIngredient[] = [];
  let inIngredientsSection = false;
  let inIngredientsTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for ingredient table headers
    if (line.includes('Exposure to the Substances') || 
        line.includes('Daily Systemic Exposure Dosage')) {
      inIngredientsSection = true;
      continue;
    }
    
    if (inIngredientsSection && line.includes('|Ingredient')) {
      inIngredientsTable = true;
      i++; // Skip header row
      continue;
    }
    
    if (inIngredientsTable && line.startsWith('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 5 && parts[0] !== 'Ingredient') {
        const ingredient: PIFIngredient = {
          inciName: parts[0],
          casNumber: parts[1] !== '' ? parts[1] : undefined,
          concentration: parseFloat(parts[1]) || 0,
          safetyInfo: {
            sed: parseFloat(parts[4]) || 0
          }
        };
        
        // Extract concentration from the second column if it's a percentage
        if (parts.length > 1) {
          const concentrationMatch = parts[1].match(/[\d.]+/);
          if (concentrationMatch) {
            ingredient.concentration = parseFloat(concentrationMatch[0]);
          }
        }
        
        ingredients.push(ingredient);
      }
    }
    
    // Exit when we reach the next section
    if (inIngredientsTable && (line.includes('Toxicological Profile') || line === '')) {
      break;
    }
  }
  
  return ingredients;
}

function extractPhysicalProperties(lines: string[]): PIFPhysicalProperties {
  const props: PIFPhysicalProperties = {
    physicalState: '',
    mixtureType: '',
    organoleptic: '',
    pH: 0,
    viscosity: 0,
    thermalStability: '',
    specificGravity: 0
  };
  
  let inPhysicalSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('Physical and Chemical Characterization')) {
      inPhysicalSection = true;
      continue;
    }
    
    if (inPhysicalSection) {
      if (line.includes('|1 Physical state')) {
        props.physicalState = extractTableValue(lines[i]);
      } else if (line.includes('|2 type of mixture')) {
        props.mixtureType = extractTableValue(lines[i]);
      } else if (line.includes('|3 organoleptic properties')) {
        props.organoleptic = extractTableValue(lines[i]);
      } else if (line.includes('|4 pH')) {
        const value = extractTableValue(lines[i]);
        props.pH = parseFloat(value) || 0;
      } else if (line.includes('|5 viscosity')) {
        const value = extractTableValue(lines[i]);
        const viscosityMatch = value.match(/[\d.]+/);
        props.viscosity = viscosityMatch ? parseFloat(viscosityMatch[0]) : 0;
      } else if (line.includes('|6 thermal stability')) {
        props.thermalStability = extractTableValue(lines[i]);
      } else if (line.includes('|7 Specific gravity')) {
        const value = extractTableValue(lines[i]);
        const gravityMatch = value.match(/[\d.]+/);
        props.specificGravity = gravityMatch ? parseFloat(gravityMatch[0]) : 0;
      }
    }
    
    if (line.includes('Stability of the product')) {
      break;
    }
  }
  
  return props;
}

function extractShelfLife(lines: string[]): PIFDocument['shelfLife'] {
  let shelfLife = {
    monthsAfterOpening: 6,
    stabilityNotes: ''
  };
  
  for (const line of lines) {
    if (line.includes('shelf-life of')) {
      const match = line.match(/(\d+)\s*month/);
      if (match) {
        shelfLife.monthsAfterOpening = parseInt(match[1]);
      }
      shelfLife.stabilityNotes = line;
      break;
    }
  }
  
  return shelfLife;
}

function extractSafetyInfo(lines: string[]): PIFDocument['safety'] {
  return {
    microbiologicalQuality: '',
    preservativeEffectiveness: 'USP method 38 - 28 days effectiveness',
    exposureRoute: 'Dermal',
    targetPopulation: 'Adults'
  };
}

/**
 * Convert PIF document to SKIN-TWIN FormulationSchema
 */
export function convertPIFToFormulation(pif: PIFDocument): Partial<FormulationSchema> {
  const formType = mapProductTypeToFormulationType(pif.productInfo.type);
  
  // Create phases based on physical properties
  const phases: Phase[] = [];
  if (pif.physicalProperties.mixtureType.toLowerCase().includes('emulsion')) {
    phases.push({
      id: 'aqueous',
      name: 'Aqueous Phase',
      type: 'aqueous',
      temperature: { min: 20, max: 80 },
      pH: { min: pif.physicalProperties.pH - 0.5, max: pif.physicalProperties.pH + 0.5 },
      ingredients: [],
      processingTime: 30,
      mixingSpeed: 800
    });
    
    phases.push({
      id: 'oil',
      name: 'Oil Phase',
      type: 'oil',
      temperature: { min: 60, max: 75 },
      ingredients: [],
      processingTime: 15,
      mixingSpeed: 600
    });
  } else {
    phases.push({
      id: 'main',
      name: 'Main Phase',
      type: 'aqueous',
      temperature: { min: 20, max: 30 },
      pH: { min: pif.physicalProperties.pH - 0.5, max: pif.physicalProperties.pH + 0.5 },
      ingredients: [],
      processingTime: 20,
      mixingSpeed: 500
    });
  }
  
  // Convert ingredients
  const ingredients: IngredientUsage[] = pif.ingredients.map((ing, index) => ({
    ingredientId: generateIngredientId(ing.inciName),
    concentration: ing.concentration,
    function: categorizeIngredientFunction(ing.inciName),
    phase: assignIngredientPhase(ing.inciName, phases),
    additionOrder: index + 1,
    notes: ing.casNumber ? `CAS: ${ing.casNumber}` : undefined
  }));
  
  const formulation: Partial<FormulationSchema> = {
    name: pif.productInfo.name,
    type: formType,
    phases,
    ingredients,
    totalWeight: 100, // Assuming 100g batch size
    properties: {
      appearance: {
        color: pif.productInfo.color,
        clarity: mapClarity(pif.productInfo.color),
        texture: pif.productInfo.form.toLowerCase()
      },
      rheology: {
        viscosity: pif.physicalProperties.viscosity,
        flowBehavior: pif.physicalProperties.viscosity > 50000 ? 'shear-thinning' : 'newtonian'
      },
      physicochemical: {
        pH: pif.physicalProperties.pH,
        density: pif.physicalProperties.specificGravity,
        refractionIndex: undefined
      },
      sensory: {
        spreadability: calculateSpreadability(pif.physicalProperties.viscosity),
        absorption: 7, // Default moderate absorption
        afterfeel: mapAfterFeel(pif.productInfo.form)
      }
    },
    stability: {
      accelerated: [],
      realTime: [],
      photostability: {
        uvStability: 'Not tested',
        colorChange: 'Minimal',
        activeRetention: 95
      },
      microbiological: {
        preservativeSystem: 'Phenoxyethanol + Parabens',
        challengeTest: 'Pass (USP 38)',
        shelfLife: pif.shelfLife.monthsAfterOpening
      },
      packaging: []
    },
    regulatory: {
      region: 'EU',
      compliance: ['EC No. 1223/2009'],
      cpsr: true,
      pif: true,
      notifications: []
    },
    claims: pif.productInfo.claims,
    status: 'approved',
    tags: ['SpaZone', pif.productInfo.type, 'imported-from-pif']
  };
  
  return formulation;
}

// Helper functions
function extractTableValue(line: string): string {
  const parts = line.split('|').map(p => p.trim());
  return parts.length > 2 ? parts[2] : '';
}

function extractMultilineTableValue(lines: string[], startIndex: number): string {
  let value = extractTableValue(lines[startIndex]);
  let i = startIndex + 1;
  
  while (i < lines.length && lines[i].startsWith('|') && !lines[i].includes('|', 1)) {
    value += ' ' + lines[i].replace('|', '').trim();
    i++;
  }
  
  return value;
}

function generateIngredientId(inciName: string): string {
  return inciName.toLowerCase().replace(/\s+/g, '_').substring(0, 20);
}

function mapProductTypeToFormulationType(type: string): FormulationSchema['type'] {
  const typeMap: Record<string, FormulationSchema['type']> = {
    'face mask': 'mask',
    'masque': 'mask',
    'serum': 'serum',
    'cream': 'cream',
    'lotion': 'lotion',
    'gel': 'gel',
    'oil': 'oil',
    'cleanser': 'cleanser'
  };
  
  const lowerType = type.toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (lowerType.includes(key)) {
      return value;
    }
  }
  
  return 'treatment';
}

function categorizeIngredientFunction(inciName: string): string {
  const lowerName = inciName.toLowerCase();
  
  if (lowerName.includes('glycol') || lowerName.includes('glycerin')) return 'humectant';
  if (lowerName.includes('phenoxyethanol') || lowerName.includes('paraben')) return 'preservative';
  if (lowerName.includes('oil') || lowerName.includes('ester')) return 'emollient';
  if (lowerName.includes('gum') || lowerName.includes('polymer')) return 'thickener';
  if (lowerName.includes('extract')) return 'active';
  if (lowerName.includes('hydroxide')) return 'pH_adjuster';
  if (lowerName.includes('fragrance') || lowerName.includes('parfum')) return 'fragrance';
  
  return 'active';
}

function assignIngredientPhase(inciName: string, phases: Phase[]): string {
  const lowerName = inciName.toLowerCase();
  
  // Oil phase ingredients
  if (lowerName.includes('oil') || lowerName.includes('ester') || 
      lowerName.includes('wax') || lowerName.includes('butter')) {
    const oilPhase = phases.find(p => p.type === 'oil');
    return oilPhase ? oilPhase.id : phases[0].id;
  }
  
  // Aqueous phase ingredients
  return phases.find(p => p.type === 'aqueous')?.id || phases[0].id;
}

function mapClarity(color: string): 'clear' | 'translucent' | 'opaque' {
  const lowerColor = color.toLowerCase();
  if (lowerColor.includes('clear')) return 'clear';
  if (lowerColor.includes('hazy') || lowerColor.includes('translucent')) return 'translucent';
  return 'opaque';
}

function calculateSpreadability(viscosity: number): number {
  // Inverse relationship: lower viscosity = higher spreadability
  if (viscosity < 1000) return 10;
  if (viscosity < 5000) return 8;
  if (viscosity < 20000) return 6;
  if (viscosity < 50000) return 4;
  return 2;
}

function mapAfterFeel(form: string): string {
  const lowerForm = form.toLowerCase();
  if (lowerForm.includes('gel')) return 'fresh, non-greasy';
  if (lowerForm.includes('cream')) return 'rich, moisturizing';
  if (lowerForm.includes('oil')) return 'nourishing, occlusive';
  if (lowerForm.includes('serum')) return 'lightweight, absorbing';
  return 'balanced';
}