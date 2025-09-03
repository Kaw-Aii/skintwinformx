#!/usr/bin/env node

/**
 * Script to import PIF documents and generate formulation templates
 * Usage: node scripts/import-pif-documents.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PIF_DIR = path.join(__dirname, '..', 'vessels', 'msdspif');
const OUTPUT_DIR = path.join(__dirname, '..', 'vessels', 'formulations', 'imported');
const TEMPLATES_DIR = path.join(__dirname, '..', 'vessels', 'templates', 'generated');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

/**
 * Simple PIF document parser (JavaScript version)
 */
function parsePIFDocument(content) {
  const lines = content.split('\n');
  
  const productInfo = {
    name: '',
    type: '',
    form: '',
    packSize: '',
    claims: []
  };
  
  const ingredients = [];
  let inIngredientsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract product name
    if (line.includes('Product Name:')) {
      productInfo.name = line.split(':')[1]?.trim() || '';
    }
    
    // Extract product type
    if (line.includes('|Product type')) {
      const parts = line.split('|').map(p => p.trim());
      productInfo.type = parts[2] || '';
    }
    
    // Extract form
    if (line.includes('|Form')) {
      const parts = line.split('|').map(p => p.trim());
      productInfo.form = parts[2] || '';
    }
    
    // Extract pack size
    if (line.includes('|Pack size')) {
      const parts = line.split('|').map(p => p.trim());
      productInfo.packSize = parts[2] || '';
    }
    
    // Extract claims
    if (line.includes('Product claims:') && lines[i + 2]) {
      productInfo.claims.push(lines[i + 2].trim());
    }
    
    // Parse ingredients table
    if (line.includes('Exposure to the Substances')) {
      inIngredientsSection = true;
    }
    
    if (inIngredientsSection && line.startsWith('|') && !line.includes('Ingredient')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 3 && parts[0] !== '') {
        ingredients.push({
          name: parts[0],
          casNumber: parts[1] || '',
          concentration: parseFloat(parts[2]) || 0
        });
      }
    }
  }
  
  return {
    productInfo,
    ingredients
  };
}

/**
 * Convert parsed PIF to formulation file
 */
function convertToFormulation(pifData, fileName) {
  const formulation = {
    id: fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
    name: pifData.productInfo.name,
    type: pifData.productInfo.type.toLowerCase(),
    version: '1.0.0',
    status: 'imported',
    dateImported: new Date().toISOString(),
    source: {
      type: 'PIF',
      fileName: fileName
    },
    product: {
      form: pifData.productInfo.form,
      packSize: pifData.productInfo.packSize,
      claims: pifData.productInfo.claims
    },
    ingredients: pifData.ingredients.map((ing, index) => ({
      order: index + 1,
      inciName: ing.name,
      casNumber: ing.casNumber,
      concentration: ing.concentration,
      unit: '%'
    })),
    metadata: {
      totalIngredients: pifData.ingredients.length,
      totalConcentration: pifData.ingredients.reduce((sum, ing) => sum + ing.concentration, 0)
    }
  };
  
  return formulation;
}

/**
 * Generate template from formulation
 */
function generateTemplate(formulation) {
  const template = {
    id: `${formulation.id}_template`,
    name: `${formulation.name} Template`,
    description: `Template generated from ${formulation.name}`,
    baseFormulation: formulation.id,
    variables: [
      {
        name: 'batch_size',
        type: 'number',
        default: 1000,
        unit: 'g',
        min: 100,
        max: 10000
      },
      {
        name: 'preservation_system',
        type: 'select',
        options: ['standard', 'natural', 'preservative-free'],
        default: 'standard'
      }
    ],
    calculations: {
      ingredientAmounts: 'concentration * batch_size / 100'
    },
    instructions: [
      'Prepare all ingredients according to the formula',
      'Follow standard emulsion procedure if applicable',
      'Adjust pH as needed',
      'Perform quality control checks'
    ]
  };
  
  return template;
}

/**
 * Process all PIF files
 */
function processAllPIFFiles() {
  console.log('🔍 Scanning PIF directory:', PIF_DIR);
  
  const files = fs.readdirSync(PIF_DIR).filter(f => f.endsWith('.doc'));
  console.log(`📁 Found ${files.length} PIF files`);
  
  const results = {
    processed: [],
    errors: [],
    summary: {
      totalFiles: files.length,
      successful: 0,
      failed: 0
    }
  };
  
  for (const fileName of files) {
    console.log(`\n📄 Processing: ${fileName}`);
    
    try {
      const filePath = path.join(PIF_DIR, fileName);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse PIF document
      const pifData = parsePIFDocument(content);
      console.log(`  ✓ Parsed: ${pifData.productInfo.name}`);
      console.log(`  ✓ Found ${pifData.ingredients.length} ingredients`);
      
      // Convert to formulation
      const formulation = convertToFormulation(pifData, fileName);
      const formulationFileName = `${formulation.id}.json`;
      const formulationPath = path.join(OUTPUT_DIR, formulationFileName);
      
      fs.writeFileSync(formulationPath, JSON.stringify(formulation, null, 2));
      console.log(`  ✓ Created formulation: ${formulationFileName}`);
      
      // Generate template
      const template = generateTemplate(formulation);
      const templateFileName = `${template.id}.json`;
      const templatePath = path.join(TEMPLATES_DIR, templateFileName);
      
      fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
      console.log(`  ✓ Created template: ${templateFileName}`);
      
      results.processed.push({
        fileName,
        productName: pifData.productInfo.name,
        formulation: formulationFileName,
        template: templateFileName
      });
      results.summary.successful++;
      
    } catch (error) {
      console.error(`  ✗ Error processing ${fileName}:`, error.message);
      results.errors.push({
        fileName,
        error: error.message
      });
      results.summary.failed++;
    }
  }
  
  // Generate summary report
  const reportPath = path.join(OUTPUT_DIR, 'import-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log(`  Total files: ${results.summary.totalFiles}`);
  console.log(`  ✓ Successful: ${results.summary.successful}`);
  console.log(`  ✗ Failed: ${results.summary.failed}`);
  console.log(`\n📁 Output locations:`);
  console.log(`  Formulations: ${OUTPUT_DIR}`);
  console.log(`  Templates: ${TEMPLATES_DIR}`);
  console.log(`  Report: ${reportPath}`);
  console.log('='.repeat(60));
  
  return results;
}

// Create index file for easy access
function createIndexFile(results) {
  const indexContent = {
    generated: new Date().toISOString(),
    formulations: results.processed.map(p => ({
      id: p.formulation.replace('.json', ''),
      name: p.productName,
      file: p.formulation,
      template: p.template,
      source: p.fileName
    }))
  };
  
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexContent, null, 2));
  console.log(`\n✓ Created index file: ${indexPath}`);
}

// Main execution
if (require.main === module) {
  console.log('🧪 SkinTwin PIF Document Import Tool');
  console.log('====================================\n');
  
  const results = processAllPIFFiles();
  
  if (results.summary.successful > 0) {
    createIndexFile(results);
  }
  
  console.log('\n✨ Import process complete!');
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Some files had errors. Check import-report.json for details.');
  }
}