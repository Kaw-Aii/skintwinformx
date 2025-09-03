/**
 * API endpoint for importing and processing PIF documents
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { parsePIFDocument, convertPIFToFormulation } from '~/lib/vessels/pif-parser';
import { generateTemplateFromPIF, generateBatchSchema } from '~/lib/vessels/pif-template-generator';
import * as fs from 'fs';
import * as path from 'path';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    
    switch (action) {
      case 'import-single':
        return handleSingleImport(formData);
      case 'import-batch':
        return handleBatchImport(formData);
      case 'generate-templates':
        return handleTemplateGeneration(formData);
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('PIF Import Error:', error);
    return json({ 
      error: 'Failed to process PIF import',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleSingleImport(formData: FormData) {
  const fileContent = formData.get('content') as string;
  const fileName = formData.get('fileName') as string;
  
  if (!fileContent) {
    return json({ error: 'No file content provided' }, { status: 400 });
  }
  
  // Parse PIF document
  const pifDocument = parsePIFDocument(fileContent);
  
  // Convert to formulation schema
  const formulation = convertPIFToFormulation(pifDocument);
  
  // Generate template
  const template = generateTemplateFromPIF(pifDocument, formulation, {
    allowVariableConcentrations: true,
    preserveOriginalClaims: true,
    generateVariations: false
  });
  
  return json({
    success: true,
    data: {
      pif: pifDocument,
      formulation,
      template,
      fileName
    }
  });
}

async function handleBatchImport(formData: FormData) {
  const directoryPath = formData.get('directoryPath') as string || 'vessels/msdspif';
  
  try {
    // Read all PIF files from directory
    const pifFiles = await readPIFDirectory(directoryPath);
    const results = [];
    
    for (const file of pifFiles) {
      const content = await readFileContent(file.path);
      const pifDocument = parsePIFDocument(content);
      const formulation = convertPIFToFormulation(pifDocument);
      const template = generateTemplateFromPIF(pifDocument, formulation);
      
      results.push({
        fileName: file.name,
        pif: pifDocument,
        formulation,
        template
      });
    }
    
    // Generate batch schema
    const batchSchema = generateBatchSchema(
      results.map(r => r.pif),
      results.map(r => r.template)
    );
    
    return json({
      success: true,
      data: {
        totalProcessed: results.length,
        results,
        batchSchema
      }
    });
  } catch (error) {
    return json({ 
      error: 'Failed to process batch import',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleTemplateGeneration(formData: FormData) {
  const formulations = JSON.parse(formData.get('formulations') as string || '[]');
  const variationTypes = JSON.parse(formData.get('variationTypes') as string || '[]');
  
  const templates = [];
  
  for (const formulation of formulations) {
    // Create base template
    const baseTemplate = {
      id: `template_${Date.now()}`,
      name: formulation.name + ' Template',
      description: 'Auto-generated template',
      category: formulation.type,
      baseFormulation: formulation,
      variables: [],
      constraints: []
    };
    
    templates.push(baseTemplate);
    
    // Generate variations if requested
    if (variationTypes.length > 0) {
      const variations = generateVariations(baseTemplate, variationTypes);
      templates.push(...variations);
    }
  }
  
  return json({
    success: true,
    data: {
      templates,
      totalGenerated: templates.length
    }
  });
}

// Helper functions for file operations
async function readPIFDirectory(directoryPath: string): Promise<{ name: string; path: string }[]> {
  // This would need to be adapted for the actual runtime environment
  // For now, returning mock data based on known files
  return [
    { name: 'PIF - SpaZone - Marine Replenishing Peptide Masque - 2021_08.doc', path: `${directoryPath}/PIF - SpaZone - Marine Replenishing Peptide Masque - 2021_08.doc` },
    { name: 'PIF - SpaZone - Instant Facial Lifting Wonder Serum - 2021_08.doc', path: `${directoryPath}/PIF - SpaZone - Instant Facial Lifting Wonder Serum - 2021_08.doc` },
    { name: 'PIF - SpaZone - O2 Purifyer Face + Body Enhancing Serum - 2021_08.doc', path: `${directoryPath}/PIF - SpaZone - O2 Purifyer Face + Body Enhancing Serum - 2021_08.doc` },
    { name: 'PIF - SpaZone - O2 Radiance Luminosity Masque - 2021_08.doc', path: `${directoryPath}/PIF - SpaZone - O2 Radiance Luminosity Masque - 2021_08.doc` },
    { name: 'PIF - SpaZone - Urban Stress Protect + Detox Clarifying Masque - 2021_08.doc', path: `${directoryPath}/PIF - SpaZone - Urban Stress Protect + Detox Clarifying Masque - 2021_08.doc` }
  ];
}

async function readFileContent(filePath: string): Promise<string> {
  // This would need actual file system access in the runtime
  // For demonstration, returning placeholder
  return `Product Information File content for ${filePath}`;
}

function generateVariations(baseTemplate: any, types: string[]): any[] {
  const variations = [];
  
  for (const type of types) {
    const variation = { ...baseTemplate };
    variation.id = `${baseTemplate.id}_${type}`;
    variation.name = `${baseTemplate.name} - ${type}`;
    variations.push(variation);
  }
  
  return variations;
}