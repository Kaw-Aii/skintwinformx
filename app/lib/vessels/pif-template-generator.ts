/**
 * Template Generator for PIF-based Formulations
 * Creates reusable templates from parsed PIF documents
 */

import type { FormulationSchema, FormulationTemplate, TemplateVariable } from '~/types/vessels';
import type { PIFDocument } from './pif-parser';

export interface PIFTemplateConfig {
  allowVariableConcentrations: boolean;
  preserveOriginalClaims: boolean;
  generateVariations: boolean;
}

/**
 * Generate a formulation template from a PIF document
 */
export function generateTemplateFromPIF(
  pif: PIFDocument,
  formulation: Partial<FormulationSchema>,
  config: PIFTemplateConfig = {
    allowVariableConcentrations: true,
    preserveOriginalClaims: true,
    generateVariations: false
  }
): FormulationTemplate {
  const templateId = generateTemplateId(pif.productInfo.name);
  
  const variables: TemplateVariable[] = [];
  
  // Add concentration variables for key actives
  if (config.allowVariableConcentrations) {
    formulation.ingredients?.forEach(ing => {
      if (ing.function === 'active' || ing.function === 'humectant') {
        variables.push({
          name: `${ing.ingredientId}_concentration`,
          type: 'concentration',
          defaultValue: ing.concentration,
          range: {
            min: ing.concentration * 0.5,
            max: ing.concentration * 1.5
          }
        });
      }
    });
  }
  
  // Add pH variable
  if (formulation.properties?.physicochemical?.pH) {
    variables.push({
      name: 'target_ph',
      type: 'ph',
      defaultValue: formulation.properties.physicochemical.pH,
      range: {
        min: formulation.properties.physicochemical.pH - 1,
        max: formulation.properties.physicochemical.pH + 1
      }
    });
  }
  
  // Add viscosity variable
  if (formulation.properties?.rheology?.viscosity) {
    variables.push({
      name: 'target_viscosity',
      type: 'viscosity',
      defaultValue: formulation.properties.rheology.viscosity,
      range: {
        min: formulation.properties.rheology.viscosity * 0.7,
        max: formulation.properties.rheology.viscosity * 1.3
      }
    });
  }
  
  const template: FormulationTemplate = {
    id: templateId,
    name: `${pif.productInfo.name} Template`,
    description: `Template based on ${pif.productInfo.name} - ${pif.productInfo.type}`,
    category: formulation.type || 'treatment',
    baseFormulation: formulation,
    variables,
    constraints: [
      {
        type: 'total_concentration',
        parameters: {
          target: 100,
          tolerance: 0.1
        }
      },
      {
        type: 'ph_range',
        parameters: {
          min: 3.5,
          max: 8.0
        }
      }
    ]
  };
  
  return template;
}

/**
 * Generate multiple template variations from a single PIF
 */
export function generateTemplateVariations(
  baseTemplate: FormulationTemplate,
  variationTypes: ('sensitive' | 'enhanced' | 'natural')[]
): FormulationTemplate[] {
  const variations: FormulationTemplate[] = [];
  
  for (const type of variationTypes) {
    const variation = { ...baseTemplate };
    variation.id = `${baseTemplate.id}_${type}`;
    variation.name = `${baseTemplate.name} - ${type.charAt(0).toUpperCase() + type.slice(1)} Version`;
    
    switch (type) {
      case 'sensitive':
        variation.baseFormulation = modifyForSensitiveSkin(baseTemplate.baseFormulation);
        variation.description += ' - Modified for sensitive skin';
        break;
      case 'enhanced':
        variation.baseFormulation = enhanceActives(baseTemplate.baseFormulation);
        variation.description += ' - Enhanced active concentrations';
        break;
      case 'natural':
        variation.baseFormulation = convertToNatural(baseTemplate.baseFormulation);
        variation.description += ' - Natural/organic variation';
        break;
    }
    
    variations.push(variation);
  }
  
  return variations;
}

/**
 * Create a formulation schema for batch processing
 */
export interface BatchFormulationSchema {
  templates: FormulationTemplate[];
  metadata: {
    source: string;
    dateCreated: Date;
    totalProducts: number;
    categories: string[];
  };
  processingInstructions: {
    defaultBatchSize: number;
    scalingFactor: number;
    mixingProtocol: string;
  };
}

/**
 * Generate batch processing schema from multiple PIFs
 */
export function generateBatchSchema(
  pifDocuments: PIFDocument[],
  templates: FormulationTemplate[]
): BatchFormulationSchema {
  const categories = [...new Set(templates.map(t => t.category))];
  
  return {
    templates,
    metadata: {
      source: 'PIF Import',
      dateCreated: new Date(),
      totalProducts: pifDocuments.length,
      categories
    },
    processingInstructions: {
      defaultBatchSize: 1000, // grams
      scalingFactor: 10,
      mixingProtocol: 'standard_emulsion'
    }
  };
}

// Helper functions for template variations
function modifyForSensitiveSkin(formulation: Partial<FormulationSchema>): Partial<FormulationSchema> {
  const modified = { ...formulation };
  
  // Remove or reduce fragrances
  if (modified.ingredients) {
    modified.ingredients = modified.ingredients.map(ing => {
      if (ing.function === 'fragrance') {
        return { ...ing, concentration: ing.concentration * 0.1 }; // Reduce to 10%
      }
      if (ing.function === 'preservative') {
        // Switch to gentler preservatives if possible
        return ing;
      }
      return ing;
    });
  }
  
  // Add soothing claims
  if (modified.claims) {
    modified.claims = [
      ...modified.claims,
      'Suitable for sensitive skin',
      'Dermatologically tested',
      'Hypoallergenic formula'
    ];
  }
  
  return modified;
}

function enhanceActives(formulation: Partial<FormulationSchema>): Partial<FormulationSchema> {
  const enhanced = { ...formulation };
  
  // Increase active concentrations
  if (enhanced.ingredients) {
    enhanced.ingredients = enhanced.ingredients.map(ing => {
      if (ing.function === 'active') {
        // Increase by 50% but cap at safe levels
        const newConc = Math.min(ing.concentration * 1.5, 10);
        return { ...ing, concentration: newConc };
      }
      return ing;
    });
  }
  
  // Update claims for enhanced version
  if (enhanced.claims) {
    enhanced.claims = enhanced.claims.map(claim => 
      claim + ' (Enhanced Formula)'
    );
  }
  
  return enhanced;
}

function convertToNatural(formulation: Partial<FormulationSchema>): Partial<FormulationSchema> {
  const natural = { ...formulation };
  
  // Flag synthetic ingredients for replacement
  if (natural.ingredients) {
    natural.ingredients = natural.ingredients.map(ing => {
      const notes = ing.notes || '';
      return {
        ...ing,
        notes: notes + ' [Consider natural alternative]'
      };
    });
  }
  
  // Add natural/organic tags
  if (natural.tags) {
    natural.tags = [...natural.tags, 'natural', 'organic-compatible'];
  }
  
  // Update regulatory compliance
  if (natural.regulatory) {
    natural.regulatory = {
      ...natural.regulatory,
      compliance: [...(natural.regulatory.compliance || []), 'COSMOS', 'ECOCERT']
    };
  }
  
  return natural;
}

function generateTemplateId(productName: string): string {
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 30) + 
    '_template';
}

/**
 * Export template to various formats
 */
export function exportTemplate(
  template: FormulationTemplate,
  format: 'json' | 'yaml' | 'markdown'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(template, null, 2);
      
    case 'yaml':
      return convertToYAML(template);
      
    case 'markdown':
      return convertToMarkdown(template);
      
    default:
      return JSON.stringify(template);
  }
}

function convertToYAML(template: FormulationTemplate): string {
  // Simple YAML conversion (would need proper YAML library in production)
  let yaml = `id: ${template.id}\n`;
  yaml += `name: ${template.name}\n`;
  yaml += `description: ${template.description}\n`;
  yaml += `category: ${template.category}\n`;
  yaml += `\nvariables:\n`;
  
  template.variables.forEach(v => {
    yaml += `  - name: ${v.name}\n`;
    yaml += `    type: ${v.type}\n`;
    yaml += `    default: ${v.defaultValue}\n`;
    if (v.range) {
      yaml += `    range:\n`;
      yaml += `      min: ${v.range.min}\n`;
      yaml += `      max: ${v.range.max}\n`;
    }
  });
  
  return yaml;
}

function convertToMarkdown(template: FormulationTemplate): string {
  let md = `# ${template.name}\n\n`;
  md += `**ID:** ${template.id}\n\n`;
  md += `**Description:** ${template.description}\n\n`;
  md += `**Category:** ${template.category}\n\n`;
  
  md += `## Variables\n\n`;
  template.variables.forEach(v => {
    md += `- **${v.name}** (${v.type})\n`;
    md += `  - Default: ${v.defaultValue}\n`;
    if (v.range) {
      md += `  - Range: ${v.range.min} - ${v.range.max}\n`;
    }
  });
  
  md += `\n## Base Formulation\n\n`;
  if (template.baseFormulation.ingredients) {
    md += `| Ingredient | Concentration | Function |\n`;
    md += `|------------|---------------|----------|\n`;
    template.baseFormulation.ingredients.forEach(ing => {
      md += `| ${ing.ingredientId} | ${ing.concentration}% | ${ing.function} |\n`;
    });
  }
  
  return md;
}