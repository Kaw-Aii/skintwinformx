#!/usr/bin/env tsx
/**
 * Enrich Product and Supplier Vessels with Hypergraph Data
 * 
 * This script enriches product and supplier vessels with:
 * - Network metrics and statistics
 * - Relationship data from hypergraph edges
 * - Complexity scores and centrality measures
 */

import * as fs from 'fs';
import * as path from 'path';

const VESSELS_DIR = path.join(process.cwd(), 'vessels');
const PRODUCTS_DIR = path.join(VESSELS_DIR, 'products');
const SUPPLIERS_DIR = path.join(VESSELS_DIR, 'suppliers');
const FORMULATIONS_DIR = path.join(VESSELS_DIR, 'formulations');
const INGREDIENTS_DIR = path.join(VESSELS_DIR, 'ingredients');
const EDGES_DIR = path.join(VESSELS_DIR, 'edges');
const EXAMPLES_DIR = path.join(VESSELS_DIR, 'examples');

// Simple CSV parser
function parseCSV(content: string, delimiter: string = '\t'): any[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }
  
  return rows;
}

// Load all edges
function loadAllEdges(): any[] {
  const allEdgesPath = path.join(EDGES_DIR, 'all_edges.json');
  return JSON.parse(fs.readFileSync(allEdgesPath, 'utf-8'));
}

// Load hypergraph nodes
function loadNodes() {
  const rawNodesPath = path.join(EXAMPLES_DIR, 'RAW-Nodes.csv');
  const rsNodesPath = path.join(EXAMPLES_DIR, 'RSNodes.csv');
  
  const rawNodes = parseCSV(fs.readFileSync(rawNodesPath, 'utf-8'), '\t');
  const rsNodes = parseCSV(fs.readFileSync(rsNodesPath, 'utf-8'), '\t');
  
  return { rawNodes, rsNodes };
}

// Enrich product vessels
function enrichProductVessels() {
  console.log('Enriching product vessels...');
  
  const edges = loadAllEdges();
  const { rawNodes } = loadNodes();
  
  // Group edges by product
  const formulationEdgesByProduct = new Map<string, any[]>();
  for (const edge of edges) {
    if (edge.type === 'INGREDIENT_IN_FORMULATION') {
      const productId = edge.target_id;
      if (!formulationEdgesByProduct.has(productId)) {
        formulationEdgesByProduct.set(productId, []);
      }
      formulationEdgesByProduct.get(productId)!.push(edge);
    }
  }
  
  // Build node metadata map
  const nodeMetadata = new Map<string, any>();
  for (const node of rawNodes) {
    const id = node.Id?.trim();
    if (id) {
      nodeMetadata.set(id, node);
    }
  }
  
  // Process each product file
  const files = fs.readdirSync(PRODUCTS_DIR);
  let enriched = 0;
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filepath = path.join(PRODUCTS_DIR, file);
    const product = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    const productId = product.id;
    const edges = formulationEdgesByProduct.get(productId);
    const nodeMeta = nodeMetadata.get(productId);
    
    if (!edges || edges.length === 0) {
      continue;
    }
    
    // Calculate network metrics
    const ingredientCount = edges.length;
    const totalConcentration = edges.reduce((sum: number, e: any) => 
      sum + (e.properties?.concentration || 0), 0);
    
    // Sort ingredients by concentration
    const sortedEdges = [...edges].sort((a, b) => 
      (b.properties?.concentration || 0) - (a.properties?.concentration || 0));
    
    // Get unique ingredient IDs
    const ingredientIds = Array.from(new Set(edges.map((e: any) => e.source_id)));
    
    // Add/update hypergraph metadata
    product.hypergraph_metadata = {
      node_id: productId,
      modularity_class: nodeMeta?.modularity_class ? parseInt(nodeMeta.modularity_class) : undefined,
      timeset: nodeMeta?.timeset
    };
    
    // Add/update formulation metadata
    product.formulation_metadata = {
      ingredient_count: ingredientCount,
      total_concentration: totalConcentration,
      complexity_score: ingredientCount,
      ingredient_ids: ingredientIds,
      top_ingredients: sortedEdges.slice(0, 5).map((e: any) => ({
        ingredient_id: e.source_id,
        concentration: e.properties.concentration
      }))
    };
    
    // Update ingredient_count if it exists
    if ('ingredient_count' in product) {
      product.ingredient_count = ingredientCount;
    }
    
    // Calculate network centrality (normalized by max ingredient count)
    product.network_properties = {
      centrality_score: ingredientCount / 180, // Normalized by total ingredient count
      complexity_tier: ingredientCount < 15 ? 'simple' : 
                      ingredientCount < 25 ? 'moderate' : 'complex',
      formulation_density: totalConcentration / 100
    };
    
    // Write updated product
    fs.writeFileSync(filepath, JSON.stringify(product, null, 2));
    
    console.log(`  Enriched ${productId}: ${ingredientCount} ingredients, ${totalConcentration.toFixed(1)}% concentration`);
    enriched++;
  }
  
  console.log(`✓ Enriched ${enriched} product vessels`);
}

// Enrich supplier vessels
function enrichSupplierVessels() {
  console.log('\nEnriching supplier vessels...');
  
  const edges = loadAllEdges();
  const { rsNodes } = loadNodes();
  
  // Group edges by supplier
  const supplyEdgesBySupplier = new Map<string, any[]>();
  for (const edge of edges) {
    if (edge.type === 'SUPPLIER_PROVIDES_INGREDIENT') {
      const supplierId = edge.source_id;
      if (!supplyEdgesBySupplier.has(supplierId)) {
        supplyEdgesBySupplier.set(supplierId, []);
      }
      supplyEdgesBySupplier.get(supplierId)!.push(edge);
    }
  }
  
  // Build node metadata map
  const nodeMetadata = new Map<string, any>();
  for (const node of rsNodes) {
    const id = node.Id?.trim();
    if (id && !id.startsWith('R')) {
      nodeMetadata.set(id, node);
    }
  }
  
  // Create or update supplier files
  let created = 0;
  let enriched = 0;
  
  for (const [supplierId, edges] of supplyEdgesBySupplier) {
    const nodeMeta = nodeMetadata.get(supplierId);
    if (!nodeMeta) continue;
    
    const supplierName = nodeMeta.Label?.trim() || supplierId;
    
    // Find or create supplier file
    const files = fs.readdirSync(SUPPLIERS_DIR);
    let supplierFile = files.find(f => f.includes(supplierId) || f.includes(supplierName.replace(/[^a-zA-Z0-9]/g, '_')));
    
    let supplier: any;
    let filepath: string;
    
    if (supplierFile) {
      // Update existing supplier
      filepath = path.join(SUPPLIERS_DIR, supplierFile);
      supplier = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    } else {
      // Create new supplier
      const filename = `${supplierId}_${supplierName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.json`;
      filepath = path.join(SUPPLIERS_DIR, filename);
      supplier = {
        id: supplierId,
        name: supplierName,
        label: supplierName,
        category: 'Unknown',
        location: 'South Africa'
      };
      created++;
    }
    
    // Calculate portfolio metrics
    const portfolioSize = edges.length;
    const ingredientIds = edges.map((e: any) => e.target_id);
    
    // Add/update hypergraph metadata
    supplier.hypergraph_metadata = {
      node_id: supplierId,
      modularity_class: nodeMeta.modularity_class ? parseInt(nodeMeta.modularity_class) : undefined,
      timeset: nodeMeta.timeset
    };
    
    // Add/update portfolio data
    supplier.portfolio = {
      ingredient_count: portfolioSize,
      ingredient_ids: ingredientIds,
      specialization_index: portfolioSize / 180, // Normalized
      market_coverage: (portfolioSize / 180) * 100 // Percentage
    };
    
    // Add network properties
    supplier.network_properties = {
      centrality_score: portfolioSize / 180,
      portfolio_size_tier: portfolioSize < 3 ? 'specialized' : 
                          portfolioSize < 10 ? 'focused' : 'diversified',
      supply_chain_importance: portfolioSize / 180
    };
    
    // Write supplier
    fs.writeFileSync(filepath, JSON.stringify(supplier, null, 2));
    
    console.log(`  ${created > enriched ? 'Created' : 'Enriched'} ${supplierName}: ${portfolioSize} ingredients`);
    enriched++;
  }
  
  console.log(`✓ Created ${created} new supplier vessels`);
  console.log(`✓ Enriched ${enriched} total supplier vessels`);
}

// Create product vessels for missing products
function createMissingProductVessels() {
  console.log('\nCreating missing product vessels...');
  
  const edges = loadAllEdges();
  const { rawNodes } = loadNodes();
  
  // Get all product IDs from edges
  const productIds = new Set<string>();
  for (const edge of edges) {
    if (edge.type === 'INGREDIENT_IN_FORMULATION') {
      productIds.add(edge.target_id);
    }
  }
  
  // Check which products already exist
  const existingProducts = new Set<string>();
  const files = fs.readdirSync(PRODUCTS_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filepath = path.join(PRODUCTS_DIR, file);
      const product = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      existingProducts.add(product.id);
    }
  }
  
  // Build node metadata map
  const nodeMetadata = new Map<string, any>();
  for (const node of rawNodes) {
    const id = node.Id?.trim();
    if (id) {
      nodeMetadata.set(id, node);
    }
  }
  
  // Create missing products
  let created = 0;
  for (const productId of productIds) {
    if (existingProducts.has(productId)) continue;
    
    const nodeMeta = nodeMetadata.get(productId);
    const productName = nodeMeta?.Label?.trim() || productId.replace('B19PRD', '').replace(/_/g, ' ');
    
    // Get edges for this product
    const productEdges = edges.filter((e: any) => 
      e.type === 'INGREDIENT_IN_FORMULATION' && e.target_id === productId);
    
    const ingredientCount = productEdges.length;
    const totalConcentration = productEdges.reduce((sum: number, e: any) => 
      sum + (e.properties?.concentration || 0), 0);
    
    const product = {
      id: productId,
      label: productName,
      type: 'Unknown',
      form: 'Unknown',
      category: 'treatment',
      ingredient_count: ingredientCount,
      source: {
        hypergraph_generated: true,
        extraction_date: new Date().toISOString()
      },
      hypergraph_metadata: {
        node_id: productId,
        modularity_class: nodeMeta?.modularity_class ? parseInt(nodeMeta.modularity_class) : undefined,
        timeset: nodeMeta?.timeset
      },
      formulation_metadata: {
        ingredient_count: ingredientCount,
        total_concentration: totalConcentration,
        complexity_score: ingredientCount
      },
      network_properties: {
        centrality_score: ingredientCount / 180,
        complexity_tier: ingredientCount < 15 ? 'simple' : 
                        ingredientCount < 25 ? 'moderate' : 'complex',
        formulation_density: totalConcentration / 100
      }
    };
    
    const filename = `${productId}.json`;
    const filepath = path.join(PRODUCTS_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(product, null, 2));
    
    console.log(`  Created ${productId}: ${productName}`);
    created++;
  }
  
  console.log(`✓ Created ${created} new product vessels`);
}

// Main
console.log('=== Product and Supplier Vessel Enrichment ===\n');

try {
  createMissingProductVessels();
  enrichProductVessels();
  enrichSupplierVessels();
  
  console.log('\n✓ Enrichment complete!');
} catch (error) {
  console.error('Error during enrichment:', error);
  process.exit(1);
}
