#!/usr/bin/env tsx
/**
 * Update Formulation Vessels with Hypergraph Data
 * 
 * This script enriches existing formulation vessels with complete ingredient
 * data from the hypergraph edges.
 */

import * as fs from 'fs';
import * as path from 'path';

const VESSELS_DIR = path.join(process.cwd(), 'vessels');
const FORMULATIONS_DIR = path.join(VESSELS_DIR, 'formulations');
const INGREDIENTS_DIR = path.join(VESSELS_DIR, 'ingredients');
const EDGES_DIR = path.join(VESSELS_DIR, 'edges');
const PRODUCTS_DIR = path.join(VESSELS_DIR, 'products');

interface FormulationIngredient {
  order: number;
  inci_name: string;
  ingredient_id?: string;
  concentration: number;
  function: string;
  phase?: string;
}

interface Formulation {
  id: string;
  product_reference: string;
  name: string;
  ingredients: FormulationIngredient[];
  total_concentration: number;
  complexity_score?: number;
  phases?: any;
  extraction_metadata?: any;
  hypergraph_metadata?: {
    ingredient_count: number;
    centrality_score?: number;
    network_density?: number;
  };
}

interface Edge {
  id: string;
  type: string;
  source_id: string;
  source_type: string;
  target_id: string;
  target_type: string;
  properties: {
    concentration: number;
    weight: number;
    created_at: string;
  };
}

// Load all edges
function loadAllEdges(): Map<string, Edge[]> {
  const allEdgesPath = path.join(EDGES_DIR, 'all_edges.json');
  const allEdges: Edge[] = JSON.parse(fs.readFileSync(allEdgesPath, 'utf-8'));
  
  // Group by target (product)
  const edgesByProduct = new Map<string, Edge[]>();
  
  for (const edge of allEdges) {
    if (edge.type === 'INGREDIENT_IN_FORMULATION') {
      const productId = edge.target_id;
      if (!edgesByProduct.has(productId)) {
        edgesByProduct.set(productId, []);
      }
      edgesByProduct.get(productId)!.push(edge);
    }
  }
  
  return edgesByProduct;
}

// Load ingredient data
function loadIngredientData(): Map<string, any> {
  const ingredients = new Map<string, any>();
  
  const files = fs.readdirSync(INGREDIENTS_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filepath = path.join(INGREDIENTS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      ingredients.set(data.id, data);
    }
  }
  
  return ingredients;
}

// Map product file names to product IDs
function getProductIdMapping(): Map<string, string> {
  const mapping = new Map<string, string>();
  
  // Read product files to get ID mappings
  const files = fs.readdirSync(PRODUCTS_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filepath = path.join(PRODUCTS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      if (data.id) {
        // Map both the ID itself and common variations
        mapping.set(data.id, data.id);
        
        // Extract product name for matching
        const productName = data.label || data.name || '';
        if (productName) {
          mapping.set(productName.toUpperCase(), data.id);
        }
      }
    }
  }
  
  return mapping;
}

// Update formulation vessels
function updateFormulationVessels() {
  console.log('Loading hypergraph data...');
  const edgesByProduct = loadAllEdges();
  const ingredients = loadIngredientData();
  const productIdMapping = getProductIdMapping();
  
  console.log(`Loaded ${edgesByProduct.size} product formulations from edges`);
  console.log(`Loaded ${ingredients.size} ingredient definitions`);
  
  // Process each formulation file
  const files = fs.readdirSync(FORMULATIONS_DIR);
  let updated = 0;
  let created = 0;
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filepath = path.join(FORMULATIONS_DIR, file);
    const formulation: Formulation = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    // Try to find matching product edges
    let productId = formulation.product_reference || formulation.id;
    let edges = edgesByProduct.get(productId);
    
    // If no direct match, try to find by searching
    if (!edges) {
      for (const [pid, pedges] of edgesByProduct) {
        if (pid.includes(productId) || productId.includes(pid)) {
          edges = pedges;
          productId = pid;
          break;
        }
      }
    }
    
    if (!edges || edges.length === 0) {
      console.log(`  No edges found for ${formulation.id}`);
      continue;
    }
    
    // Build ingredient list from edges
    const newIngredients: FormulationIngredient[] = [];
    let totalConcentration = 0;
    
    // Sort edges by concentration (descending)
    edges.sort((a, b) => b.properties.concentration - a.properties.concentration);
    
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const ingredientData = ingredients.get(edge.source_id);
      
      newIngredients.push({
        order: i + 1,
        inci_name: ingredientData?.inci_name || ingredientData?.label || edge.source_id,
        ingredient_id: edge.source_id,
        concentration: edge.properties.concentration,
        function: 'Unknown', // Would need enrichment from ingredient data
        phase: edge.properties.concentration > 50 ? 'aqueous' : 'active'
      });
      
      totalConcentration += edge.properties.concentration;
    }
    
    // Update formulation
    const originalIngredientCount = formulation.ingredients?.length || 0;
    formulation.ingredients = newIngredients;
    formulation.total_concentration = totalConcentration;
    formulation.complexity_score = newIngredients.length;
    
    // Add hypergraph metadata
    formulation.hypergraph_metadata = {
      ingredient_count: newIngredients.length,
      centrality_score: newIngredients.length / 180, // Normalized by total ingredient count
      network_density: totalConcentration / 100
    };
    
    // Write updated formulation
    fs.writeFileSync(filepath, JSON.stringify(formulation, null, 2));
    
    if (originalIngredientCount > 0) {
      console.log(`  Updated ${formulation.id}: ${originalIngredientCount} → ${newIngredients.length} ingredients`);
      updated++;
    } else {
      console.log(`  Created ingredients for ${formulation.id}: ${newIngredients.length} ingredients`);
      created++;
    }
  }
  
  // Create formulation files for products that don't have them
  console.log('\nCreating missing formulation files...');
  for (const [productId, edges] of edgesByProduct) {
    // Check if formulation exists
    const formFilename = `${productId}.json`;
    const formFilepath = path.join(FORMULATIONS_DIR, formFilename);
    
    if (fs.existsSync(formFilepath)) continue;
    
    // Create new formulation
    const newFormulation: Formulation = {
      id: productId.replace('B19PRD', 'B19FRM'),
      product_reference: productId,
      name: productId.replace('B19PRD', '').replace(/_/g, ' '),
      ingredients: [],
      total_concentration: 0
    };
    
    // Build ingredient list
    let totalConcentration = 0;
    edges.sort((a, b) => b.properties.concentration - a.properties.concentration);
    
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const ingredientData = ingredients.get(edge.source_id);
      
      newFormulation.ingredients.push({
        order: i + 1,
        inci_name: ingredientData?.inci_name || edge.source_id,
        ingredient_id: edge.source_id,
        concentration: edge.properties.concentration,
        function: 'Unknown'
      });
      
      totalConcentration += edge.properties.concentration;
    }
    
    newFormulation.total_concentration = totalConcentration;
    newFormulation.complexity_score = newFormulation.ingredients.length;
    newFormulation.hypergraph_metadata = {
      ingredient_count: newFormulation.ingredients.length,
      centrality_score: newFormulation.ingredients.length / 180,
      network_density: totalConcentration / 100
    };
    
    fs.writeFileSync(formFilepath, JSON.stringify(newFormulation, null, 2));
    console.log(`  Created ${newFormulation.id} with ${newFormulation.ingredients.length} ingredients`);
    created++;
  }
  
  console.log(`\n✓ Updated ${updated} existing formulations`);
  console.log(`✓ Created ${created} new formulations`);
}

// Main
console.log('=== Formulation Vessel Updater ===\n');
updateFormulationVessels();
console.log('\n✓ Complete!');
