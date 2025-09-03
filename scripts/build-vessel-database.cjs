#!/usr/bin/env node

/**
 * Build comprehensive vessel database from all data sources
 * Integrates COSING, PIF, and existing vessel data
 */

const fs = require('fs');
const path = require('path');

// Configuration
const VESSELS_DIR = path.join(__dirname, '..', 'vessels');
const DATABASE_OUTPUT = path.join(VESSELS_DIR, 'database');

// Ensure output directory exists
if (!fs.existsSync(DATABASE_OUTPUT)) {
  fs.mkdirSync(DATABASE_OUTPUT, { recursive: true });
}

/**
 * Load and parse COSING data
 */
function loadCOSINGData() {
  console.log('📚 Loading COSING ingredient database...');
  
  const cosingPath = path.join(VESSELS_DIR, 'cosing', 'ingredients.json');
  if (fs.existsSync(cosingPath)) {
    const content = fs.readFileSync(cosingPath, 'utf8');
    const data = JSON.parse(content);
    console.log(`  ✓ Loaded ${data.length} COSING ingredients`);
    return data;
  }
  
  console.log('  ⚠️ COSING data not found');
  return [];
}

/**
 * Load imported PIF formulations
 */
function loadPIFFormulations() {
  console.log('📋 Loading PIF formulations...');
  
  const pifDir = path.join(VESSELS_DIR, 'formulations', 'imported');
  const formulations = [];
  
  if (fs.existsSync(pifDir)) {
    const files = fs.readdirSync(pifDir)
      .filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'import-report.json');
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(pifDir, file), 'utf8');
      const formulation = JSON.parse(content);
      formulations.push(formulation);
    });
    
    console.log(`  ✓ Loaded ${formulations.length} PIF formulations`);
  } else {
    console.log('  ⚠️ No PIF formulations found');
  }
  
  return formulations;
}

/**
 * Load existing formulation files
 */
function loadFormulationFiles() {
  console.log('🧪 Loading formulation files...');
  
  const formDir = path.join(VESSELS_DIR, 'formulations');
  const formulations = [];
  
  if (fs.existsSync(formDir)) {
    const files = fs.readdirSync(formDir)
      .filter(f => f.endsWith('.formul'));
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(formDir, file), 'utf8');
      // Parse custom formulation format (simplified for this example)
      const lines = content.split('\n');
      const formulation = {
        id: file.replace('.formul', ''),
        name: lines.find(l => l.startsWith('# '))?.replace('# ', '').trim() || file,
        ingredients: [],
        source: 'formul_file'
      };
      
      // Extract ingredients from formulation file
      let inIngredientSection = false;
      lines.forEach(line => {
        if (line.includes('## Ingredients')) {
          inIngredientSection = true;
        } else if (inIngredientSection && line.startsWith('- ')) {
          const match = line.match(/- (.+?)\s+\((.+?)%\)/);
          if (match) {
            formulation.ingredients.push({
              name: match[1],
              concentration: parseFloat(match[2])
            });
          }
        }
      });
      
      formulations.push(formulation);
    });
    
    console.log(`  ✓ Loaded ${formulations.length} formulation files`);
  }
  
  return formulations;
}

/**
 * Load product data
 */
function loadProducts() {
  console.log('📦 Loading product data...');
  
  const prodDir = path.join(VESSELS_DIR, 'products');
  const products = [];
  
  if (fs.existsSync(prodDir)) {
    const files = fs.readdirSync(prodDir)
      .filter(f => f.endsWith('.product'));
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(prodDir, file), 'utf8');
      const lines = content.split('\n');
      
      const product = {
        id: file.replace('.product', ''),
        name: lines.find(l => l.startsWith('# '))?.replace('# ', '').trim() || '',
        brand: lines.find(l => l.includes('Brand:'))?.split(':')[1]?.trim() || '',
        category: lines.find(l => l.includes('Category:'))?.split(':')[1]?.trim() || '',
        claims: []
      };
      
      // Extract claims
      const claimsStart = lines.findIndex(l => l.includes('## Claims'));
      if (claimsStart !== -1) {
        for (let i = claimsStart + 1; i < lines.length; i++) {
          if (lines[i].startsWith('- ')) {
            product.claims.push(lines[i].replace('- ', '').trim());
          } else if (lines[i].startsWith('##')) {
            break;
          }
        }
      }
      
      products.push(product);
    });
    
    console.log(`  ✓ Loaded ${products.length} products`);
  }
  
  return products;
}

/**
 * Load supplier data
 */
function loadSuppliers() {
  console.log('🏭 Loading supplier data...');
  
  const supDir = path.join(VESSELS_DIR, 'suppliers');
  const suppliers = [];
  
  if (fs.existsSync(supDir)) {
    const files = fs.readdirSync(supDir)
      .filter(f => f.endsWith('.supplier'));
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(supDir, file), 'utf8');
      const lines = content.split('\n');
      
      const supplier = {
        id: file.replace('.supplier', ''),
        name: lines.find(l => l.startsWith('# '))?.replace('# ', '').trim() || '',
        region: lines.find(l => l.includes('Region:'))?.split(':')[1]?.trim() || '',
        ingredients: [],
        certifications: []
      };
      
      // Extract ingredients supplied
      const ingStart = lines.findIndex(l => l.includes('## Ingredients'));
      if (ingStart !== -1) {
        for (let i = ingStart + 1; i < lines.length; i++) {
          if (lines[i].startsWith('- ')) {
            supplier.ingredients.push(lines[i].replace('- ', '').trim());
          } else if (lines[i].startsWith('##')) {
            break;
          }
        }
      }
      
      suppliers.push(supplier);
    });
    
    console.log(`  ✓ Loaded ${suppliers.length} suppliers`);
  }
  
  return suppliers;
}

/**
 * Build ingredient master list
 */
function buildIngredientMaster(cosing, formulations) {
  const ingredients = new Map();
  
  // Add COSING ingredients
  cosing.forEach(ing => {
    const id = ing.inci_name;
    ingredients.set(id, {
      id,
      inci_name: ing.inci_name,
      cas_number: ing.cas_number,
      function: ing.function,
      concentration_min: ing.concentration_min,
      concentration_max: ing.concentration_max,
      is_natural: ing.is_natural,
      is_restricted: ing.is_restricted,
      is_gras: ing.is_gras,
      usage_count: 0,
      formulations: [],
      source: 'cosing'
    });
  });
  
  // Count usage in formulations
  formulations.forEach(formulation => {
    if (formulation.ingredients) {
      formulation.ingredients.forEach(ing => {
        const name = ing.inciName || ing.name;
        if (name) {
          const normalizedName = name.toUpperCase();
          if (!ingredients.has(normalizedName)) {
            ingredients.set(normalizedName, {
              id: normalizedName,
              inci_name: normalizedName,
              cas_number: ing.casNumber || '',
              function: 'Unknown',
              concentration_min: 0.01,
              concentration_max: 100,
              is_natural: false,
              is_restricted: false,
              is_gras: false,
              usage_count: 0,
              formulations: [],
              source: 'formulation'
            });
          }
          
          const ingredient = ingredients.get(normalizedName);
          ingredient.usage_count++;
          ingredient.formulations.push(formulation.id || formulation.name);
        }
      });
    }
  });
  
  return ingredients;
}

/**
 * Build relationships between entities
 */
function buildRelationships(ingredients, formulations, products, suppliers) {
  const relationships = {
    ingredient_to_formulation: new Map(),
    formulation_to_product: new Map(),
    ingredient_to_supplier: new Map(),
    ingredient_compatibility: new Map()
  };
  
  // Build ingredient to formulation relationships
  formulations.forEach(formulation => {
    if (formulation.ingredients) {
      formulation.ingredients.forEach(ing => {
        const name = (ing.inciName || ing.name || '').toUpperCase();
        if (!relationships.ingredient_to_formulation.has(name)) {
          relationships.ingredient_to_formulation.set(name, []);
        }
        relationships.ingredient_to_formulation.get(name).push(
          formulation.id || formulation.name
        );
      });
    }
  });
  
  // Build ingredient to supplier relationships
  suppliers.forEach(supplier => {
    supplier.ingredients.forEach(ing => {
      const name = ing.toUpperCase();
      if (!relationships.ingredient_to_supplier.has(name)) {
        relationships.ingredient_to_supplier.set(name, []);
      }
      relationships.ingredient_to_supplier.get(name).push(supplier.id);
    });
  });
  
  return relationships;
}

/**
 * Generate database statistics
 */
function generateStatistics(database) {
  const stats = {
    summary: {
      total_ingredients: database.ingredients.size,
      total_formulations: database.formulations.length,
      total_products: database.products.length,
      total_suppliers: database.suppliers.length,
      total_relationships: database.relationships.ingredient_to_formulation.size
    },
    ingredients: {
      cosing_sourced: 0,
      formulation_sourced: 0,
      natural: 0,
      restricted: 0,
      gras: 0,
      most_used: []
    },
    formulations: {
      by_source: {},
      average_ingredients: 0
    },
    coverage: {
      ingredients_with_cosing_data: 0,
      ingredients_with_suppliers: 0,
      formulations_validated: 0
    }
  };
  
  // Calculate ingredient statistics
  database.ingredients.forEach(ing => {
    if (ing.source === 'cosing') stats.ingredients.cosing_sourced++;
    if (ing.source === 'formulation') stats.ingredients.formulation_sourced++;
    if (ing.is_natural) stats.ingredients.natural++;
    if (ing.is_restricted) stats.ingredients.restricted++;
    if (ing.is_gras) stats.ingredients.gras++;
  });
  
  // Find most used ingredients
  const sortedIngredients = Array.from(database.ingredients.values())
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10);
  
  stats.ingredients.most_used = sortedIngredients.map(ing => ({
    name: ing.inci_name,
    usage_count: ing.usage_count,
    function: ing.function
  }));
  
  // Calculate formulation statistics
  let totalIngredientCount = 0;
  database.formulations.forEach(formulation => {
    const source = formulation.source || 'unknown';
    stats.formulations.by_source[source] = (stats.formulations.by_source[source] || 0) + 1;
    if (formulation.ingredients) {
      totalIngredientCount += formulation.ingredients.length;
    }
  });
  
  stats.formulations.average_ingredients = database.formulations.length > 0
    ? totalIngredientCount / database.formulations.length
    : 0;
  
  // Calculate coverage
  database.ingredients.forEach(ing => {
    if (ing.source === 'cosing') {
      stats.coverage.ingredients_with_cosing_data++;
    }
  });
  
  database.relationships.ingredient_to_supplier.forEach(() => {
    stats.coverage.ingredients_with_suppliers++;
  });
  
  return stats;
}

/**
 * Export database to various formats
 */
function exportDatabase(database, format = 'json') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    // Export full database
    const fullPath = path.join(DATABASE_OUTPUT, `vessel_database_${timestamp}.json`);
    fs.writeFileSync(fullPath, JSON.stringify(database, replacer, 2));
    console.log(`  ✓ Exported full database to ${fullPath}`);
    
    // Export ingredients separately
    const ingPath = path.join(DATABASE_OUTPUT, 'ingredients_master.json');
    fs.writeFileSync(ingPath, JSON.stringify(
      Array.from(database.ingredients.values()),
      null,
      2
    ));
    console.log(`  ✓ Exported ingredients to ${ingPath}`);
    
    // Export relationships
    const relPath = path.join(DATABASE_OUTPUT, 'relationships.json');
    fs.writeFileSync(relPath, JSON.stringify(
      mapToObject(database.relationships),
      null,
      2
    ));
    console.log(`  ✓ Exported relationships to ${relPath}`);
    
    // Export statistics
    const stats = generateStatistics(database);
    const statsPath = path.join(DATABASE_OUTPUT, 'database_statistics.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`  ✓ Exported statistics to ${statsPath}`);
  }
}

// Helper function to convert Map to plain object for JSON
function replacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries())
    };
  }
  return value;
}

function mapToObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Map) {
      result[key] = Array.from(value.entries());
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 SKIN-TWIN Vessel Database Builder');
  console.log('=====================================\n');
  
  // Load all data sources
  const cosing = loadCOSINGData();
  const pifFormulations = loadPIFFormulations();
  const formulationFiles = loadFormulationFiles();
  const products = loadProducts();
  const suppliers = loadSuppliers();
  
  console.log('\n📊 Building comprehensive database...');
  
  // Combine all formulations
  const allFormulations = [...pifFormulations, ...formulationFiles];
  
  // Build master ingredient list
  const ingredients = buildIngredientMaster(cosing, allFormulations);
  console.log(`  ✓ Built master list of ${ingredients.size} ingredients`);
  
  // Build relationships
  const relationships = buildRelationships(
    ingredients,
    allFormulations,
    products,
    suppliers
  );
  console.log(`  ✓ Built relationship graph`);
  
  // Create database object
  const database = {
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      sources: {
        cosing: cosing.length,
        pif_formulations: pifFormulations.length,
        formulation_files: formulationFiles.length,
        products: products.length,
        suppliers: suppliers.length
      }
    },
    ingredients,
    formulations: allFormulations,
    products,
    suppliers,
    relationships
  };
  
  // Generate statistics
  console.log('\n📈 Database Statistics:');
  const stats = generateStatistics(database);
  console.log(`  • Total Ingredients: ${stats.summary.total_ingredients}`);
  console.log(`  • Total Formulations: ${stats.summary.total_formulations}`);
  console.log(`  • Total Products: ${stats.summary.total_products}`);
  console.log(`  • Total Suppliers: ${stats.summary.total_suppliers}`);
  console.log(`  • Natural Ingredients: ${stats.ingredients.natural}`);
  console.log(`  • Restricted Ingredients: ${stats.ingredients.restricted}`);
  console.log(`  • Average Ingredients per Formulation: ${stats.formulations.average_ingredients.toFixed(1)}`);
  
  console.log('\n📝 Most Used Ingredients:');
  stats.ingredients.most_used.slice(0, 5).forEach((ing, i) => {
    console.log(`  ${i + 1}. ${ing.name} (${ing.usage_count} uses) - ${ing.function}`);
  });
  
  // Export database
  console.log('\n💾 Exporting database...');
  exportDatabase(database);
  
  console.log('\n✨ Database build complete!');
  console.log(`📁 Output location: ${DATABASE_OUTPUT}`);
}

// Run if executed directly
if (require.main === module) {
  main();
}