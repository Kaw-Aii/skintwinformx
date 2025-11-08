#!/usr/bin/env tsx
/**
 * SKIN-TWIN Hypergraph Data Builder
 * 
 * This script parses the hypergraph CSV files and generates:
 * 1. Complete ingredient vessel JSON files
 * 2. Updated formulation vessels with full ingredient lists
 * 3. Hypergraph edge files linking all nodes
 * 4. Network metrics and statistics
 */

import * as fs from 'fs';
import * as path from 'path';

// Simple CSV parser function
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

// Type definitions matching the hypergraph architecture
interface Node {
  id: string;
  label: string;
  timeset?: string;
  modularity_class?: number;
}

interface ProductNode extends Node {
  id: string; // Format: B19*
  complexity?: number;
  category?: string;
}

interface IngredientNode extends Node {
  id: string; // Format: R*
  max_concentration?: number;
  usage_frequency?: number;
  criticality_score?: number;
}

interface SupplierNode extends Node {
  portfolio_size?: number;
  specialization_index?: number;
  geographic_region?: string;
}

interface Edge {
  source: string;
  target: string;
  type: 'Directed';
  id: number;
  label?: string;
  timeset?: string;
  weight: number;
}

interface FormulationEdge extends Edge {
  concentration: number;
}

interface SupplyEdge extends Edge {
  supplier_id: string;
  ingredient_id: string;
}

interface IngredientVessel {
  id: string;
  inci_name: string;
  label: string;
  category: string;
  functions: string[];
  concentration_range: {
    min: number;
    max: number;
  };
  network_properties: {
    usage_frequency: number;
    max_concentration: number;
    centrality_score?: number;
    clustering_coefficient?: number;
  };
  suppliers: string[];
  hypergraph_metadata: {
    node_id: string;
    modularity_class?: number;
    timeset?: string;
  };
}

const VESSELS_DIR = path.join(process.cwd(), 'vessels');
const EXAMPLES_DIR = path.join(VESSELS_DIR, 'examples');
const INGREDIENTS_DIR = path.join(VESSELS_DIR, 'ingredients');
const FORMULATIONS_DIR = path.join(VESSELS_DIR, 'formulations');
const PRODUCTS_DIR = path.join(VESSELS_DIR, 'products');
const SUPPLIERS_DIR = path.join(VESSELS_DIR, 'suppliers');
const EDGES_DIR = path.join(VESSELS_DIR, 'edges');

// Load CSV files
function loadCSV(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseCSV(content, '\t');
}

// Load hypergraph data
function loadHypergraphData() {
  console.log('Loading hypergraph data from CSV files...');
  
  const rawNodes = loadCSV(path.join(EXAMPLES_DIR, 'RAW-Nodes.csv'));
  const rawEdges = loadCSV(path.join(EXAMPLES_DIR, 'RAW-Edges.csv'));
  const rsNodes = loadCSV(path.join(EXAMPLES_DIR, 'RSNodes.csv'));
  const rsEdges = loadCSV(path.join(EXAMPLES_DIR, 'RSEdges.csv'));
  
  console.log(`Loaded ${rawNodes.length} product/ingredient nodes`);
  console.log(`Loaded ${rawEdges.length} formulation edges`);
  console.log(`Loaded ${rsNodes.length} supplier/ingredient nodes`);
  console.log(`Loaded ${rsEdges.length} supply chain edges`);
  
  return { rawNodes, rawEdges, rsNodes, rsEdges };
}

// Separate nodes by type
function categorizeNodes(rawNodes: any[], rsNodes: any[]) {
  const productNodes: ProductNode[] = [];
  const ingredientNodesFromRAW: Map<string, IngredientNode> = new Map();
  const supplierNodes: SupplierNode[] = [];
  const ingredientNodesFromRS: Map<string, IngredientNode> = new Map();
  
  // Process RAW nodes (products and ingredients)
  for (const node of rawNodes) {
    const id = node.Id?.trim();
    const label = node.Label?.trim();
    
    if (!id || !label) continue;
    
    if (id.startsWith('B19PRD') || id.startsWith('B19') || id.startsWith('B1930') || id.startsWith('B1950')) {
      // Product node
      productNodes.push({
        id,
        label,
        timeset: node.timeset,
        modularity_class: node.modularity_class ? parseInt(node.modularity_class) : undefined
      });
    } else if (id.startsWith('R')) {
      // Ingredient node
      ingredientNodesFromRAW.set(id, {
        id,
        label,
        timeset: node.timeset,
        modularity_class: node.modularity_class ? parseInt(node.modularity_class) : undefined
      });
    }
  }
  
  // Process RS nodes (suppliers and ingredients)
  for (const node of rsNodes) {
    const id = node.Id?.trim();
    const label = node.Label?.trim();
    
    if (!id || !label) continue;
    
    if (id.startsWith('R')) {
      // Ingredient node
      ingredientNodesFromRS.set(id, {
        id,
        label,
        timeset: node.timeset,
        modularity_class: node.modularity_class ? parseInt(node.modularity_class) : undefined
      });
    } else {
      // Supplier node
      supplierNodes.push({
        id,
        label,
        timeset: node.timeset,
        modularity_class: node.modularity_class ? parseInt(node.modularity_class) : undefined
      });
    }
  }
  
  // Merge ingredient nodes from both sources
  const ingredientNodes: Map<string, IngredientNode> = new Map();
  for (const [id, node] of ingredientNodesFromRAW) {
    ingredientNodes.set(id, node);
  }
  for (const [id, node] of ingredientNodesFromRS) {
    if (!ingredientNodes.has(id)) {
      ingredientNodes.set(id, node);
    }
  }
  
  console.log(`\nCategorized nodes:`);
  console.log(`  Products: ${productNodes.length}`);
  console.log(`  Ingredients: ${ingredientNodes.size}`);
  console.log(`  Suppliers: ${supplierNodes.length}`);
  
  return { productNodes, ingredientNodes, supplierNodes };
}

// Process formulation edges
function processFormulationEdges(rawEdges: any[]) {
  const formulationEdges: Map<string, FormulationEdge[]> = new Map();
  const ingredientUsage: Map<string, number> = new Map();
  const ingredientMaxConcentration: Map<string, number> = new Map();
  
  let edgeId = 1;
  for (const edge of rawEdges) {
    const source = edge.Source?.trim();
    const target = edge.Target?.trim();
    const weight = edge.Weight ? parseFloat(edge.Weight) : 0;
    
    if (!source || !target) continue;
    
    // Track usage frequency
    const currentUsage = ingredientUsage.get(source) || 0;
    ingredientUsage.set(source, currentUsage + 1);
    
    // Track max concentration
    const currentMax = ingredientMaxConcentration.get(source) || 0;
    ingredientMaxConcentration.set(source, Math.max(currentMax, weight));
    
    // Create edge
    const formulationEdge: FormulationEdge = {
      source,
      target,
      type: 'Directed',
      id: edgeId++,
      weight,
      concentration: weight
    };
    
    // Group by product (target)
    if (!formulationEdges.has(target)) {
      formulationEdges.set(target, []);
    }
    formulationEdges.get(target)!.push(formulationEdge);
  }
  
  console.log(`\nProcessed ${edgeId - 1} formulation edges`);
  console.log(`  Unique ingredients used: ${ingredientUsage.size}`);
  
  return { formulationEdges, ingredientUsage, ingredientMaxConcentration };
}

// Process supply chain edges
function processSupplyEdges(rsEdges: any[]) {
  const supplyEdges: Map<string, SupplyEdge[]> = new Map();
  const supplierPortfolio: Map<string, Set<string>> = new Map();
  const ingredientSuppliers: Map<string, Set<string>> = new Map();
  
  let edgeId = 1;
  for (const edge of rsEdges) {
    const source = edge.Source?.trim(); // Ingredient
    const target = edge.Target?.trim(); // Supplier
    const weight = edge.Weight ? parseFloat(edge.Weight) : 1;
    
    if (!source || !target) continue;
    
    // Track supplier portfolio
    if (!supplierPortfolio.has(target)) {
      supplierPortfolio.set(target, new Set());
    }
    supplierPortfolio.get(target)!.add(source);
    
    // Track ingredient suppliers
    if (!ingredientSuppliers.has(source)) {
      ingredientSuppliers.set(source, new Set());
    }
    ingredientSuppliers.get(source)!.add(target);
    
    // Create edge
    const supplyEdge: SupplyEdge = {
      source: target, // In our system, supplier is the source
      target: source, // Ingredient is the target
      type: 'Directed',
      id: edgeId++,
      weight,
      supplier_id: target,
      ingredient_id: source
    };
    
    // Group by supplier
    if (!supplyEdges.has(target)) {
      supplyEdges.set(target, []);
    }
    supplyEdges.get(target)!.push(supplyEdge);
  }
  
  console.log(`\nProcessed ${edgeId - 1} supply chain edges`);
  console.log(`  Suppliers with ingredients: ${supplierPortfolio.size}`);
  console.log(`  Ingredients with suppliers: ${ingredientSuppliers.size}`);
  
  return { supplyEdges, supplierPortfolio, ingredientSuppliers };
}

// Generate ingredient vessel files
function generateIngredientVessels(
  ingredientNodes: Map<string, IngredientNode>,
  ingredientUsage: Map<string, number>,
  ingredientMaxConcentration: Map<string, number>,
  ingredientSuppliers: Map<string, Set<string>>
) {
  console.log(`\nGenerating ingredient vessel files...`);
  
  // Ensure ingredients directory exists
  if (!fs.existsSync(INGREDIENTS_DIR)) {
    fs.mkdirSync(INGREDIENTS_DIR, { recursive: true });
  }
  
  let created = 0;
  for (const [id, node] of ingredientNodes) {
    const usage = ingredientUsage.get(id) || 0;
    const maxConc = ingredientMaxConcentration.get(id) || 0;
    const suppliers = Array.from(ingredientSuppliers.get(id) || []);
    
    // Create sanitized filename
    const filename = `${id}_${node.label.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.json`;
    const filepath = path.join(INGREDIENTS_DIR, filename);
    
    // Skip if already exists (don't overwrite manually created files)
    if (fs.existsSync(filepath)) {
      continue;
    }
    
    const vessel: IngredientVessel = {
      id,
      inci_name: node.label,
      label: node.label,
      category: 'Unknown', // Would need to be enriched from other sources
      functions: [],
      concentration_range: {
        min: 0,
        max: maxConc
      },
      network_properties: {
        usage_frequency: usage,
        max_concentration: maxConc,
        centrality_score: usage / ingredientNodes.size, // Simple centrality
        clustering_coefficient: 0 // Would need graph analysis
      },
      suppliers,
      hypergraph_metadata: {
        node_id: id,
        modularity_class: node.modularity_class,
        timeset: node.timeset
      }
    };
    
    fs.writeFileSync(filepath, JSON.stringify(vessel, null, 2));
    created++;
  }
  
  console.log(`  Created ${created} new ingredient vessel files`);
  console.log(`  Skipped ${ingredientNodes.size - created} existing files`);
}

// Generate hypergraph edge files
function generateHypergraphEdges(
  formulationEdges: Map<string, FormulationEdge[]>,
  supplyEdges: Map<string, SupplyEdge[]>
) {
  console.log(`\nGenerating hypergraph edge files...`);
  
  // Ensure edges directory exists
  if (!fs.existsSync(EDGES_DIR)) {
    fs.mkdirSync(EDGES_DIR, { recursive: true });
  }
  
  // Collect all edges for the master file
  const allEdges: any[] = [];
  
  // Generate formulation edge files (INGREDIENT -> PRODUCT)
  for (const [productId, edges] of formulationEdges) {
    for (const edge of edges) {
      const edgeId = `B19EDG_${edge.source}_${edge.target}`;
      const edgeData = {
        id: edgeId,
        type: 'INGREDIENT_IN_FORMULATION',
        source_id: edge.source,
        source_type: 'ingredient',
        target_id: edge.target,
        target_type: 'product',
        properties: {
          concentration: edge.concentration,
          weight: edge.weight,
          created_at: new Date().toISOString()
        }
      };
      
      allEdges.push(edgeData);
      
      // Write individual edge file
      const filename = `${edgeId}.json`;
      const filepath = path.join(EDGES_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(edgeData, null, 2));
    }
  }
  
  // Generate supply chain edge files (SUPPLIER -> INGREDIENT)
  for (const [supplierId, edges] of supplyEdges) {
    for (const edge of edges) {
      const edgeId = `B19EDG_${edge.source}_${edge.target}`;
      const edgeData = {
        id: edgeId,
        type: 'SUPPLIER_PROVIDES_INGREDIENT',
        source_id: edge.source,
        source_type: 'supplier',
        target_id: edge.target,
        target_type: 'ingredient',
        properties: {
          weight: edge.weight,
          created_at: new Date().toISOString()
        }
      };
      
      allEdges.push(edgeData);
      
      // Write individual edge file
      const filename = `${edgeId}.json`;
      const filepath = path.join(EDGES_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(edgeData, null, 2));
    }
  }
  
  // Update all_edges.json
  const allEdgesPath = path.join(EDGES_DIR, 'all_edges.json');
  fs.writeFileSync(allEdgesPath, JSON.stringify(allEdges, null, 2));
  
  console.log(`  Created ${allEdges.length} hypergraph edge files`);
  console.log(`  Updated all_edges.json with ${allEdges.length} edges`);
}

// Main execution
async function main() {
  console.log('=== SKIN-TWIN Hypergraph Data Builder ===\n');
  
  try {
    // Load data
    const { rawNodes, rawEdges, rsNodes, rsEdges } = loadHypergraphData();
    
    // Categorize nodes
    const { productNodes, ingredientNodes, supplierNodes } = categorizeNodes(rawNodes, rsNodes);
    
    // Process edges
    const { formulationEdges, ingredientUsage, ingredientMaxConcentration } = processFormulationEdges(rawEdges);
    const { supplyEdges, supplierPortfolio, ingredientSuppliers } = processSupplyEdges(rsEdges);
    
    // Generate vessels
    generateIngredientVessels(ingredientNodes, ingredientUsage, ingredientMaxConcentration, ingredientSuppliers);
    
    // Generate edges
    generateHypergraphEdges(formulationEdges, supplyEdges);
    
    // Generate statistics
    const stats = {
      timestamp: new Date().toISOString(),
      nodes: {
        products: productNodes.length,
        ingredients: ingredientNodes.size,
        suppliers: supplierNodes.length,
        total: productNodes.length + ingredientNodes.size + supplierNodes.length
      },
      edges: {
        formulation: Array.from(formulationEdges.values()).reduce((sum, edges) => sum + edges.length, 0),
        supply_chain: Array.from(supplyEdges.values()).reduce((sum, edges) => sum + edges.length, 0)
      },
      network_metrics: {
        average_product_complexity: Array.from(formulationEdges.values())
          .reduce((sum, edges) => sum + edges.length, 0) / formulationEdges.size,
        average_supplier_portfolio: Array.from(supplierPortfolio.values())
          .reduce((sum, set) => sum + set.size, 0) / supplierPortfolio.size,
        ingredients_with_suppliers: ingredientSuppliers.size,
        single_sourced_ingredients: Array.from(ingredientSuppliers.values())
          .filter(suppliers => suppliers.size === 1).length
      }
    };
    
    const statsPath = path.join(VESSELS_DIR, 'database', 'hypergraph_statistics.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    
    console.log(`\n=== Hypergraph Statistics ===`);
    console.log(JSON.stringify(stats, null, 2));
    
    console.log(`\n✓ Hypergraph data build complete!`);
    
  } catch (error) {
    console.error('Error building hypergraph data:', error);
    process.exit(1);
  }
}

main();
