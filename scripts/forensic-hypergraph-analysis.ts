#!/usr/bin/env tsx
/**
 * SKIN-TWIN Forensic Hypergraph Analysis & Neural Network Mapping
 * 
 * This script performs comprehensive forensic analysis on vessel data to:
 * 1. Construct RSGraph from RSNodes & RSEdges (Supply Chain Network)
 * 2. Construct RAWGraph from RAWNodes & RAWEdges (Formulation Network)
 * 3. Generate RAWSHyperGraph by integrating RSGraph & RAWGraph
 * 4. Map to HyperGraph Neural Network architecture (RAWSHGNN)
 * 
 * @author SKIN-TWIN Intelligence Team
 * @date November 2025
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Node {
  id: string;
  label: string;
  timeset?: string;
  modularity_class?: number;
  type: 'product' | 'ingredient' | 'supplier';
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

interface Graph {
  nodes: Map<string, Node>;
  edges: Edge[];
  metadata: {
    name: string;
    description: string;
    node_count: number;
    edge_count: number;
    density: number;
    created_at: string;
  };
}

interface HyperGraph extends Graph {
  layers: {
    supply_chain: Graph;
    formulation: Graph;
  };
  integrated_nodes: Map<string, Node>;
  cross_layer_edges: Edge[];
}

interface NeuralNetworkLayer {
  name: string;
  type: 'input' | 'hidden' | 'output' | 'attention' | 'aggregation';
  dimension: number;
  activation: string;
  nodes: string[];
}

interface HyperGraphNeuralNetwork {
  architecture: {
    name: string;
    type: 'HGNN';
    layers: NeuralNetworkLayer[];
  };
  feature_matrix: {
    nodes: string[];
    features: number[][];
    feature_names: string[];
  };
  adjacency_tensors: {
    supply_chain: number[][];
    formulation: number[][];
    cross_layer: number[][];
  };
  training_config: {
    learning_rate: number;
    epochs: number;
    batch_size: number;
    loss_function: string;
    optimizer: string;
  };
}

interface ForensicAnalysisReport {
  timestamp: string;
  graphs: {
    rs_graph: GraphAnalysis;
    raw_graph: GraphAnalysis;
    rawsh_hypergraph: HyperGraphAnalysis;
  };
  neural_network: {
    architecture_summary: any;
    feature_dimensions: any;
    training_readiness: any;
  };
  insights: {
    critical_nodes: any[];
    bottlenecks: any[];
    recommendations: string[];
  };
}

interface GraphAnalysis {
  basic_stats: any;
  centrality_measures: any;
  community_structure: any;
  vulnerability_assessment: any;
}

interface HyperGraphAnalysis extends GraphAnalysis {
  layer_integration: any;
  cross_layer_analysis: any;
}

/**
 * COSING Ingredient Interface
 * Represents an ingredient from the European Commission's COSING database
 * 
 * @property id - Unique COSING database identifier
 * @property name - Common name of the ingredient
 * @property inci_name - International Nomenclature of Cosmetic Ingredients (INCI) standardized name
 * @property cas_number - Chemical Abstracts Service registry number(s), multiple numbers separated by '/'
 * @property function - Primary cosmetic function (Active, Emollient, Humectant, Surfactant, etc.)
 * @property molecular_weight - Molecular weight in g/mol (optional)
 * @property solubility - Solubility characteristics in common solvents (optional)
 * @property concentration_min - Minimum recommended concentration as percentage
 * @property concentration_max - Maximum recommended concentration as percentage
 * @property safety_profile - Safety assessment summary (optional)
 * @property price_per_100g - Price per 100g in specified currency (optional)
 * @property stability_ph_min - Minimum pH for ingredient stability (optional)
 * @property stability_ph_max - Maximum pH for ingredient stability (optional)
 * @property temperature_stability - Maximum stable temperature in Celsius (optional)
 * @property incompatibilities - List of incompatible ingredient INCI names
 * @property benefits - List of cosmetic benefits
 * @property phase - Preferred formulation phase (water, oil, etc.) (optional)
 * @property is_natural - Whether ingredient is naturally derived
 * @property is_restricted - Whether ingredient has regulatory restrictions
 * @property is_gras - Whether ingredient is Generally Recognized As Safe
 */
interface COSINGIngredient {
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

interface COSINGHyperGraph extends HyperGraph {
  function_groups: Map<string, Set<string>>; // function -> ingredient IDs
  formulation_types: {
    total_combinations: number;
    function_distribution: Record<string, number>;
    formulation_patterns: Array<{
      functions: string[];
      count: number;
      example_ingredients: string[];
    }>;
  };
  cosing_metadata: {
    total_cosing_ingredients: number;
    mapped_ingredients: number;
    unmapped_ingredients: number;
    function_coverage: Record<string, number>;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

function calculateGraphDensity(nodeCount: number, edgeCount: number, directed: boolean = true): number {
  if (nodeCount <= 1) return 0;
  const maxEdges = directed ? nodeCount * (nodeCount - 1) : (nodeCount * (nodeCount - 1)) / 2;
  return edgeCount / maxEdges;
}

function calculateDegreeCentrality(nodeId: string, edges: Edge[]): { in: number; out: number; total: number } {
  let inDegree = 0;
  let outDegree = 0;
  
  for (const edge of edges) {
    if (edge.target === nodeId) inDegree++;
    if (edge.source === nodeId) outDegree++;
  }
  
  return {
    in: inDegree,
    out: outDegree,
    total: inDegree + outDegree
  };
}

function calculateBetweennessCentrality(nodeId: string, graph: Graph): number {
  // Simplified betweenness centrality calculation
  // In production, would use more sophisticated algorithms
  const neighbors = new Set<string>();
  
  for (const edge of graph.edges) {
    if (edge.source === nodeId) neighbors.add(edge.target);
    if (edge.target === nodeId) neighbors.add(edge.source);
  }
  
  return neighbors.size / graph.nodes.size;
}

function detectCommunities(graph: Graph): Map<number, Set<string>> {
  // Simplified community detection using modularity classes
  const communities = new Map<number, Set<string>>();
  
  for (const [nodeId, node] of graph.nodes) {
    const classId = node.modularity_class || 0;
    if (!communities.has(classId)) {
      communities.set(classId, new Set());
    }
    communities.get(classId)!.add(nodeId);
  }
  
  return communities;
}

// ============================================================================
// GRAPH CONSTRUCTION
// ============================================================================

class GraphBuilder {
  private vesselsDir: string;
  private examplesDir: string;
  
  constructor() {
    this.vesselsDir = path.join(process.cwd(), 'vessels');
    this.examplesDir = path.join(this.vesselsDir, 'examples');
  }
  
  /**
   * Load and parse CSV file
   */
  private loadCSV(filename: string): any[] {
    const filepath = path.join(this.examplesDir, filename);
    const content = fs.readFileSync(filepath, 'utf-8');
    return parseCSV(content, '\t');
  }
  
  /**
   * Build RSGraph from RSNodes and RSEdges (Supply Chain Network)
   */
  buildRSGraph(): Graph {
    console.log('\n=== Building RSGraph (Supply Chain Network) ===');
    
    const rsNodes = this.loadCSV('RSNodes.csv');
    const rsEdges = this.loadCSV('RSEdges.csv');
    
    const nodes = new Map<string, Node>();
    const edges: Edge[] = [];
    
    // Process nodes
    for (const row of rsNodes) {
      const id = row.Id?.trim();
      const label = row.Label?.trim();
      
      if (!id || !label) continue;
      
      const nodeType = id.startsWith('R') ? 'ingredient' : 'supplier';
      
      nodes.set(id, {
        id,
        label,
        timeset: row.timeset,
        modularity_class: row.modularity_class ? parseInt(row.modularity_class) : undefined,
        type: nodeType
      });
    }
    
    // Process edges (Supplier -> Ingredient)
    let edgeId = 1;
    for (const row of rsEdges) {
      const source = row.Source?.trim(); // Ingredient
      const target = row.Target?.trim(); // Supplier
      const weight = row.Weight ? parseFloat(row.Weight) : 1;
      
      if (!source || !target) continue;
      
      edges.push({
        source: target, // Reverse: Supplier provides Ingredient
        target: source,
        type: 'Directed',
        id: edgeId++,
        weight,
        label: row.Label,
        timeset: row.timeset
      });
    }
    
    const graph: Graph = {
      nodes,
      edges,
      metadata: {
        name: 'RSGraph',
        description: 'Supply Chain Network: Suppliers and Ingredients',
        node_count: nodes.size,
        edge_count: edges.length,
        density: calculateGraphDensity(nodes.size, edges.length),
        created_at: new Date().toISOString()
      }
    };
    
    console.log(`  Nodes: ${nodes.size} (${Array.from(nodes.values()).filter(n => n.type === 'supplier').length} suppliers, ${Array.from(nodes.values()).filter(n => n.type === 'ingredient').length} ingredients)`);
    console.log(`  Edges: ${edges.length}`);
    console.log(`  Density: ${graph.metadata.density.toFixed(4)}`);
    
    return graph;
  }
  
  /**
   * Build RAWGraph from RAW-Nodes and RAW-Edges (Formulation Network)
   */
  buildRAWGraph(): Graph {
    console.log('\n=== Building RAWGraph (Formulation Network) ===');
    
    const rawNodes = this.loadCSV('RAW-Nodes.csv');
    const rawEdges = this.loadCSV('RAW-Edges.csv');
    
    const nodes = new Map<string, Node>();
    const edges: Edge[] = [];
    
    // Process nodes
    for (const row of rawNodes) {
      const id = row.Id?.trim();
      const label = row.Label?.trim();
      
      if (!id || !label) continue;
      
      let nodeType: 'product' | 'ingredient';
      if (id.startsWith('B19PRD') || id.startsWith('B19') || id.startsWith('B1930') || id.startsWith('B1950')) {
        nodeType = 'product';
      } else {
        nodeType = 'ingredient';
      }
      
      nodes.set(id, {
        id,
        label,
        timeset: row.timeset,
        modularity_class: row.modularity_class ? parseInt(row.modularity_class) : undefined,
        type: nodeType
      });
    }
    
    // Process edges (Ingredient -> Product)
    let edgeId = 1;
    for (const row of rawEdges) {
      const source = row.Source?.trim(); // Ingredient
      const target = row.Target?.trim(); // Product
      const weight = row.Weight ? parseFloat(row.Weight) : 0;
      
      if (!source || !target) continue;
      
      edges.push({
        source,
        target,
        type: 'Directed',
        id: edgeId++,
        weight,
        label: row.Label,
        timeset: row.timeset
      });
    }
    
    const graph: Graph = {
      nodes,
      edges,
      metadata: {
        name: 'RAWGraph',
        description: 'Formulation Network: Products and Ingredients',
        node_count: nodes.size,
        edge_count: edges.length,
        density: calculateGraphDensity(nodes.size, edges.length),
        created_at: new Date().toISOString()
      }
    };
    
    console.log(`  Nodes: ${nodes.size} (${Array.from(nodes.values()).filter(n => n.type === 'product').length} products, ${Array.from(nodes.values()).filter(n => n.type === 'ingredient').length} ingredients)`);
    console.log(`  Edges: ${edges.length}`);
    console.log(`  Density: ${graph.metadata.density.toFixed(4)}`);
    
    return graph;
  }
  
  /**
   * Build RAWSHyperGraph by integrating RSGraph and RAWGraph
   */
  buildRAWSHyperGraph(rsGraph: Graph, rawGraph: Graph): HyperGraph {
    console.log('\n=== Building RAWSHyperGraph (Integrated Network) ===');
    
    // Merge all nodes
    const integratedNodes = new Map<string, Node>();
    
    // Add all nodes from both graphs
    for (const [id, node] of rsGraph.nodes) {
      integratedNodes.set(id, { ...node });
    }
    
    for (const [id, node] of rawGraph.nodes) {
      if (!integratedNodes.has(id)) {
        integratedNodes.set(id, { ...node });
      }
    }
    
    // Find cross-layer edges (ingredients that appear in both networks)
    const crossLayerEdges: Edge[] = [];
    let crossEdgeId = 1;
    
    const rsIngredients = new Set(
      Array.from(rsGraph.nodes.values())
        .filter(n => n.type === 'ingredient')
        .map(n => n.id)
    );
    
    const rawIngredients = new Set(
      Array.from(rawGraph.nodes.values())
        .filter(n => n.type === 'ingredient')
        .map(n => n.id)
    );
    
    // Cross-layer edges connect ingredients that exist in both networks
    const sharedIngredients = new Set(
      [...rsIngredients].filter(id => rawIngredients.has(id))
    );
    
    console.log(`  Shared ingredients between layers: ${sharedIngredients.size}`);
    
    // Create hypergraph structure
    const hyperGraph: HyperGraph = {
      nodes: integratedNodes,
      edges: [...rsGraph.edges, ...rawGraph.edges],
      layers: {
        supply_chain: rsGraph,
        formulation: rawGraph
      },
      integrated_nodes: integratedNodes,
      cross_layer_edges: crossLayerEdges,
      metadata: {
        name: 'RAWSHyperGraph',
        description: 'Integrated Supply Chain and Formulation Hypergraph',
        node_count: integratedNodes.size,
        edge_count: rsGraph.edges.length + rawGraph.edges.length,
        density: calculateGraphDensity(integratedNodes.size, rsGraph.edges.length + rawGraph.edges.length),
        created_at: new Date().toISOString()
      }
    };
    
    console.log(`  Total nodes: ${integratedNodes.size}`);
    console.log(`  Total edges: ${hyperGraph.edges.length}`);
    console.log(`  Cross-layer connections: ${sharedIngredients.size} ingredients`);
    console.log(`  Density: ${hyperGraph.metadata.density.toFixed(4)}`);
    
    return hyperGraph;
  }
}

// ============================================================================
// COSING HYPERGRAPH BUILDER
// ============================================================================

// Constants for function categories
const FUNCTION_UNMAPPED = 'Unmapped';
const FUNCTION_OTHER = 'Other';

class COSINGHyperGraphBuilder {
  private vesselsDir: string;
  private cosingDir: string;
  private cosingLookupIndex: Map<string, COSINGIngredient> | null = null;

  constructor() {
    this.vesselsDir = path.join(process.cwd(), 'vessels');
    this.cosingDir = path.join(this.vesselsDir, 'cosing');
  }

  /**
   * Load COSING ingredients database
   */
  private loadCOSINGDatabase(): COSINGIngredient[] {
    console.log('\n=== Loading COSING Database ===');
    const filepath = path.join(this.cosingDir, 'ingredients.json');
    
    if (!fs.existsSync(filepath)) {
      const errorMsg = 'COSING database not found at ' + filepath;
      console.error('  ✗ ' + errorMsg);
      throw new Error(errorMsg);
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    
    console.log(`  ✓ Loaded ${data.length} COSING ingredients`);
    
    // Build lookup index for performance
    this.buildLookupIndex(data);
    
    return data;
  }
  
  /**
   * Build lookup index for efficient ingredient matching
   */
  private buildLookupIndex(ingredients: COSINGIngredient[]): void {
    this.cosingLookupIndex = new Map();
    
    for (const ingredient of ingredients) {
      const normalizedName = this.normalizeINCI(ingredient.inci_name);
      this.cosingLookupIndex.set(normalizedName, ingredient);
    }
    
    console.log(`  ✓ Built lookup index with ${this.cosingLookupIndex.size} entries`);
  }

  /**
   * Normalize INCI name for matching
   * Preserves word boundaries while removing special characters
   */
  private normalizeINCI(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '') // Keep spaces and hyphens
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim();
  }

  /**
   * Map ingredient to COSING function using lookup index
   */
  private mapIngredientToCOSING(
    ingredientLabel: string,
    cosingDatabase: COSINGIngredient[]
  ): COSINGIngredient | undefined {
    const normalizedLabel = this.normalizeINCI(ingredientLabel);
    
    // Try exact match first using index
    if (this.cosingLookupIndex) {
      const exactMatch = this.cosingLookupIndex.get(normalizedLabel);
      if (exactMatch) {
        return exactMatch;
      }
    }
    
    // Fallback to partial match for complex names (still needed for variants)
    // This is less common so O(n) is acceptable
    const partialMatch = cosingDatabase.find(
      ing => {
        const normalized = this.normalizeINCI(ing.inci_name);
        return normalized.includes(normalizedLabel) || normalizedLabel.includes(normalized);
      }
    );
    
    return partialMatch;
  }

  /**
   * Build COSINGHyperGraph from RAWSHyperGraph
   */
  buildCOSINGHyperGraph(rawsHyperGraph: HyperGraph): COSINGHyperGraph {
    console.log('\n=== Building COSINGHyperGraph ===');
    
    // Load COSING database
    const cosingDatabase = this.loadCOSINGDatabase();
    
    // Group ingredients by function
    const functionGroups = new Map<string, Set<string>>();
    let mappedCount = 0;
    let unmappedCount = 0;
    
    // Process all ingredients from RAWSHyperGraph
    for (const [nodeId, node] of rawsHyperGraph.nodes) {
      if (node.type === 'ingredient') {
        const cosingMatch = this.mapIngredientToCOSING(node.label, cosingDatabase);
        
        if (cosingMatch) {
          const func = cosingMatch.function || FUNCTION_OTHER;
          if (!functionGroups.has(func)) {
            functionGroups.set(func, new Set());
          }
          functionGroups.get(func)!.add(nodeId);
          mappedCount++;
        } else {
          // Add to "Unmapped" category
          if (!functionGroups.has(FUNCTION_UNMAPPED)) {
            functionGroups.set(FUNCTION_UNMAPPED, new Set());
          }
          functionGroups.get(FUNCTION_UNMAPPED)!.add(nodeId);
          unmappedCount++;
        }
      }
    }
    
    console.log(`  Mapped ingredients: ${mappedCount}`);
    console.log(`  Unmapped ingredients: ${unmappedCount}`);
    console.log(`  Function groups: ${functionGroups.size}`);
    
    // Calculate formulation type combinations
    const formulationTypes = this.calculateFormulationTypes(
      rawsHyperGraph,
      functionGroups,
      cosingDatabase
    );
    
    // Create COSING-enhanced hypergraph
    const cosingHyperGraph: COSINGHyperGraph = {
      ...rawsHyperGraph,
      function_groups: functionGroups,
      formulation_types: formulationTypes,
      cosing_metadata: {
        total_cosing_ingredients: cosingDatabase.length,
        mapped_ingredients: mappedCount,
        unmapped_ingredients: unmappedCount,
        function_coverage: this.calculateFunctionCoverage(functionGroups)
      }
    };
    
    console.log(`  Total formulation combinations: ${formulationTypes.total_combinations}`);
    console.log(`  Formulation patterns identified: ${formulationTypes.formulation_patterns.length}`);
    
    return cosingHyperGraph;
  }

  /**
   * Calculate possible formulation type combinations
   */
  private calculateFormulationTypes(
    hyperGraph: HyperGraph,
    functionGroups: Map<string, Set<string>>,
    cosingDatabase: COSINGIngredient[]
  ): {
    total_combinations: number;
    function_distribution: Record<string, number>;
    formulation_patterns: Array<{
      functions: string[];
      count: number;
      example_ingredients: string[];
    }>;
  } {
    console.log('\n=== Calculating Formulation Types ===');
    
    // Get all products from the formulation layer
    const products = Array.from(hyperGraph.layers.formulation.nodes.values())
      .filter(n => n.type === 'product');
    
    console.log(`  Analyzing ${products.length} products`);
    
    // Build reverse index: product -> ingredients for performance
    const productToIngredients = new Map<string, Set<string>>();
    for (const product of products) {
      productToIngredients.set(product.id, new Set());
    }
    
    // Populate reverse index
    for (const edge of hyperGraph.layers.formulation.edges) {
      if (productToIngredients.has(edge.target)) {
        productToIngredients.get(edge.target)!.add(edge.source);
      }
    }
    
    // Track function combinations per product
    const productFunctionSets = new Map<string, Set<string>>();
    const formulationPatterns = new Map<string, {
      functions: string[];
      count: number;
      products: string[];
      ingredients: Set<string>;
    }>();
    
    // For each product, find its ingredients and their functions
    for (const product of products) {
      const productIngredients = productToIngredients.get(product.id) || new Set();
      const productFunctions = new Set<string>();
      
      // Map ingredients to functions
      for (const ingredientId of productIngredients) {
        // Find function of this ingredient
        for (const [func, ingSet] of functionGroups) {
          if (ingSet.has(ingredientId)) {
            productFunctions.add(func);
            break;
          }
        }
      }
      
      productFunctionSets.set(product.id, productFunctions);
      
      // Create pattern key (sorted function names)
      const patternKey = Array.from(productFunctions).sort().join('|');
      
      if (!formulationPatterns.has(patternKey)) {
        formulationPatterns.set(patternKey, {
          functions: Array.from(productFunctions).sort(),
          count: 0,
          products: [],
          ingredients: new Set()
        });
      }
      
      const pattern = formulationPatterns.get(patternKey)!;
      pattern.count++;
      pattern.products.push(product.id);
      productIngredients.forEach(ing => pattern.ingredients.add(ing));
    }
    
    // Calculate total combinations
    // This is the number of unique formulation patterns
    const totalCombinations = formulationPatterns.size;
    
    // Calculate function distribution
    const functionDistribution: Record<string, number> = {};
    for (const [func, ingredientSet] of functionGroups) {
      functionDistribution[func] = ingredientSet.size;
    }
    
    // Convert patterns to array format
    const patternsArray = Array.from(formulationPatterns.values())
      .map(p => ({
        functions: p.functions,
        count: p.count,
        example_ingredients: Array.from(p.ingredients).slice(0, 5)
      }))
      .sort((a, b) => b.count - a.count); // Sort by frequency
    
    console.log(`  Unique formulation patterns: ${totalCombinations}`);
    console.log(`  Top pattern: ${patternsArray[0]?.functions.join(', ')} (${patternsArray[0]?.count} products)`);
    
    return {
      total_combinations: totalCombinations,
      function_distribution: functionDistribution,
      formulation_patterns: patternsArray
    };
  }

  /**
   * Calculate function coverage statistics
   */
  private calculateFunctionCoverage(
    functionGroups: Map<string, Set<string>>
  ): Record<string, number> {
    const coverage: Record<string, number> = {};
    
    for (const [func, ingredientSet] of functionGroups) {
      coverage[func] = ingredientSet.size;
    }
    
    return coverage;
  }
}

// ============================================================================
// GRAPH ANALYSIS
// ============================================================================

class GraphAnalyzer {
  /**
   * Perform comprehensive analysis on a graph
   */
  analyzeGraph(graph: Graph): GraphAnalysis {
    console.log(`\n=== Analyzing ${graph.metadata.name} ===`);
    
    // Basic statistics
    const nodesByType = new Map<string, number>();
    for (const node of graph.nodes.values()) {
      const count = nodesByType.get(node.type) || 0;
      nodesByType.set(node.type, count + 1);
    }
    
    // Calculate centrality measures
    const centralityScores = new Map<string, any>();
    for (const [nodeId, node] of graph.nodes) {
      const degree = calculateDegreeCentrality(nodeId, graph.edges);
      const betweenness = calculateBetweennessCentrality(nodeId, graph);
      
      centralityScores.set(nodeId, {
        degree,
        betweenness,
        importance: (degree.total + betweenness) / 2
      });
    }
    
    // Find top nodes
    const topNodes = Array.from(centralityScores.entries())
      .sort((a, b) => b[1].importance - a[1].importance)
      .slice(0, 10)
      .map(([id, scores]) => ({
        id,
        label: graph.nodes.get(id)?.label || '',
        type: graph.nodes.get(id)?.type || '',
        ...scores
      }));
    
    // Community detection
    const communities = detectCommunities(graph);
    
    // Vulnerability assessment
    const singlePointFailures: string[] = [];
    for (const [nodeId, node] of graph.nodes) {
      const degree = calculateDegreeCentrality(nodeId, graph.edges);
      if (degree.out > 5 && node.type === 'supplier') {
        singlePointFailures.push(nodeId);
      }
    }
    
    const analysis: GraphAnalysis = {
      basic_stats: {
        nodes: graph.metadata.node_count,
        edges: graph.metadata.edge_count,
        density: graph.metadata.density,
        nodes_by_type: Object.fromEntries(nodesByType),
        average_degree: graph.edges.length / graph.nodes.size
      },
      centrality_measures: {
        top_nodes: topNodes,
        average_importance: Array.from(centralityScores.values())
          .reduce((sum, s) => sum + s.importance, 0) / centralityScores.size
      },
      community_structure: {
        num_communities: communities.size,
        communities: Array.from(communities.entries()).map(([id, nodes]) => ({
          id,
          size: nodes.size,
          members: Array.from(nodes).slice(0, 5)
        }))
      },
      vulnerability_assessment: {
        single_point_failures: singlePointFailures.length,
        critical_nodes: singlePointFailures
      }
    };
    
    console.log(`  Average degree: ${analysis.basic_stats.average_degree.toFixed(2)}`);
    console.log(`  Communities: ${analysis.community_structure.num_communities}`);
    console.log(`  Critical nodes: ${analysis.vulnerability_assessment.single_point_failures}`);
    
    return analysis;
  }
  
  /**
   * Analyze hypergraph with layer integration
   */
  analyzeHyperGraph(hyperGraph: HyperGraph): HyperGraphAnalysis {
    const baseAnalysis = this.analyzeGraph(hyperGraph);
    
    // Additional hypergraph-specific analysis
    const supplyChainAnalysis = this.analyzeGraph(hyperGraph.layers.supply_chain);
    const formulationAnalysis = this.analyzeGraph(hyperGraph.layers.formulation);
    
    // Cross-layer analysis
    const sharedIngredients = new Set<string>();
    for (const [id, node] of hyperGraph.nodes) {
      if (node.type === 'ingredient') {
        const inSupplyChain = hyperGraph.layers.supply_chain.nodes.has(id);
        const inFormulation = hyperGraph.layers.formulation.nodes.has(id);
        if (inSupplyChain && inFormulation) {
          sharedIngredients.add(id);
        }
      }
    }
    
    const hyperAnalysis: HyperGraphAnalysis = {
      ...baseAnalysis,
      layer_integration: {
        supply_chain_coverage: (hyperGraph.layers.supply_chain.nodes.size / hyperGraph.nodes.size) * 100,
        formulation_coverage: (hyperGraph.layers.formulation.nodes.size / hyperGraph.nodes.size) * 100,
        overlap_percentage: (sharedIngredients.size / hyperGraph.nodes.size) * 100,
        shared_ingredients: sharedIngredients.size
      },
      cross_layer_analysis: {
        supply_chain: supplyChainAnalysis.basic_stats,
        formulation: formulationAnalysis.basic_stats,
        integration_strength: sharedIngredients.size / Math.min(
          hyperGraph.layers.supply_chain.nodes.size,
          hyperGraph.layers.formulation.nodes.size
        )
      }
    };
    
    return hyperAnalysis;
  }
}

// ============================================================================
// HYPERGRAPH NEURAL NETWORK MAPPING
// ============================================================================

class HyperGraphNeuralNetworkMapper {
  /**
   * Map hypergraph to neural network architecture (RAWSHGNN)
   */
  mapToNeuralNetwork(hyperGraph: HyperGraph): HyperGraphNeuralNetwork {
    console.log('\n=== Mapping to HyperGraph Neural Network (RAWSHGNN) ===');
    
    // Extract node features
    const nodeIds = Array.from(hyperGraph.nodes.keys());
    const featureNames = [
      'in_degree',
      'out_degree',
      'betweenness_centrality',
      'clustering_coefficient',
      'is_supplier',
      'is_ingredient',
      'is_product',
      'modularity_class'
    ];
    
    // Build feature matrix
    const featureMatrix: number[][] = [];
    for (const nodeId of nodeIds) {
      const node = hyperGraph.nodes.get(nodeId)!;
      const degree = calculateDegreeCentrality(nodeId, hyperGraph.edges);
      const betweenness = calculateBetweennessCentrality(nodeId, hyperGraph);
      
      const features = [
        degree.in,
        degree.out,
        betweenness,
        0, // clustering_coefficient (simplified)
        node.type === 'supplier' ? 1 : 0,
        node.type === 'ingredient' ? 1 : 0,
        node.type === 'product' ? 1 : 0,
        node.modularity_class || 0
      ];
      
      featureMatrix.push(features);
    }
    
    // Build adjacency tensors
    const nodeIndexMap = new Map(nodeIds.map((id, idx) => [id, idx]));
    
    const supplyChainAdjacency = this.buildAdjacencyMatrix(
      hyperGraph.layers.supply_chain,
      nodeIndexMap,
      nodeIds.length
    );
    
    const formulationAdjacency = this.buildAdjacencyMatrix(
      hyperGraph.layers.formulation,
      nodeIndexMap,
      nodeIds.length
    );
    
    const crossLayerAdjacency = this.buildCrossLayerMatrix(
      hyperGraph,
      nodeIndexMap,
      nodeIds.length
    );
    
    // Define neural network architecture
    const architecture: NeuralNetworkLayer[] = [
      {
        name: 'input',
        type: 'input',
        dimension: featureNames.length,
        activation: 'none',
        nodes: nodeIds
      },
      {
        name: 'supply_chain_conv',
        type: 'hidden',
        dimension: 64,
        activation: 'relu',
        nodes: nodeIds.filter(id => {
          const node = hyperGraph.nodes.get(id)!;
          return node.type === 'supplier' || node.type === 'ingredient';
        })
      },
      {
        name: 'formulation_conv',
        type: 'hidden',
        dimension: 64,
        activation: 'relu',
        nodes: nodeIds.filter(id => {
          const node = hyperGraph.nodes.get(id)!;
          return node.type === 'ingredient' || node.type === 'product';
        })
      },
      {
        name: 'attention_fusion',
        type: 'attention',
        dimension: 128,
        activation: 'tanh',
        nodes: nodeIds.filter(id => hyperGraph.nodes.get(id)!.type === 'ingredient')
      },
      {
        name: 'aggregation',
        type: 'aggregation',
        dimension: 64,
        activation: 'relu',
        nodes: nodeIds
      },
      {
        name: 'output',
        type: 'output',
        dimension: 32,
        activation: 'softmax',
        nodes: nodeIds
      }
    ];
    
    const hgnn: HyperGraphNeuralNetwork = {
      architecture: {
        name: 'RAWSHGNN',
        type: 'HGNN',
        layers: architecture
      },
      feature_matrix: {
        nodes: nodeIds,
        features: featureMatrix,
        feature_names: featureNames
      },
      adjacency_tensors: {
        supply_chain: supplyChainAdjacency,
        formulation: formulationAdjacency,
        cross_layer: crossLayerAdjacency
      },
      training_config: {
        learning_rate: 0.001,
        epochs: 100,
        batch_size: 32,
        loss_function: 'cross_entropy',
        optimizer: 'adam'
      }
    };
    
    console.log(`  Input dimension: ${featureNames.length}`);
    console.log(`  Hidden layers: ${architecture.filter(l => l.type === 'hidden').length}`);
    console.log(`  Total parameters: ${this.calculateParameters(architecture)}`);
    console.log(`  Nodes in network: ${nodeIds.length}`);
    
    return hgnn;
  }
  
  private buildAdjacencyMatrix(
    graph: Graph,
    nodeIndexMap: Map<string, number>,
    size: number
  ): number[][] {
    const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    
    for (const edge of graph.edges) {
      const sourceIdx = nodeIndexMap.get(edge.source);
      const targetIdx = nodeIndexMap.get(edge.target);
      
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        matrix[sourceIdx][targetIdx] = edge.weight || 1;
      }
    }
    
    return matrix;
  }
  
  private buildCrossLayerMatrix(
    hyperGraph: HyperGraph,
    nodeIndexMap: Map<string, number>,
    size: number
  ): number[][] {
    const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    
    // Connect ingredients that appear in both layers
    for (const [id, node] of hyperGraph.nodes) {
      if (node.type === 'ingredient') {
        const inSupplyChain = hyperGraph.layers.supply_chain.nodes.has(id);
        const inFormulation = hyperGraph.layers.formulation.nodes.has(id);
        
        if (inSupplyChain && inFormulation) {
          const idx = nodeIndexMap.get(id);
          if (idx !== undefined) {
            matrix[idx][idx] = 1; // Self-connection for cross-layer nodes
          }
        }
      }
    }
    
    return matrix;
  }
  
  private calculateParameters(layers: NeuralNetworkLayer[]): number {
    let params = 0;
    for (let i = 1; i < layers.length; i++) {
      const prevDim = layers[i - 1].dimension;
      const currDim = layers[i].dimension;
      params += prevDim * currDim + currDim; // weights + biases
    }
    return params;
  }
}

// ============================================================================
// FORENSIC REPORT GENERATOR
// ============================================================================

class ForensicReportGenerator {
  /**
   * Generate comprehensive forensic analysis report
   */
  generateReport(
    rsGraph: Graph,
    rawGraph: Graph,
    hyperGraph: HyperGraph,
    rsAnalysis: GraphAnalysis,
    rawAnalysis: GraphAnalysis,
    hyperAnalysis: HyperGraphAnalysis,
    hgnn: HyperGraphNeuralNetwork
  ): ForensicAnalysisReport {
    console.log('\n=== Generating Forensic Analysis Report ===');
    
    // Critical nodes analysis
    const criticalNodes = [
      ...rsAnalysis.centrality_measures.top_nodes.slice(0, 5),
      ...rawAnalysis.centrality_measures.top_nodes.slice(0, 5)
    ].sort((a, b) => b.importance - a.importance);
    
    // Bottleneck detection
    const bottlenecks = rsAnalysis.vulnerability_assessment.critical_nodes
      .map((id: string) => ({
        id,
        label: rsGraph.nodes.get(id)?.label || '',
        type: rsGraph.nodes.get(id)?.type || '',
        risk: 'high'
      }));
    
    // Recommendations
    const recommendations = [
      'Diversify supply chain: ' + rsAnalysis.vulnerability_assessment.single_point_failures + ' critical suppliers identified',
      'Optimize formulation complexity: Average ' + rawAnalysis.basic_stats.average_degree.toFixed(1) + ' ingredients per product',
      'Strengthen cross-layer integration: ' + hyperAnalysis.layer_integration.shared_ingredients + ' shared ingredients provide resilience',
      'Implement RAWSHGNN for predictive analytics and optimization',
      'Monitor critical nodes with high betweenness centrality for supply chain disruptions'
    ];
    
    const report: ForensicAnalysisReport = {
      timestamp: new Date().toISOString(),
      graphs: {
        rs_graph: rsAnalysis,
        raw_graph: rawAnalysis,
        rawsh_hypergraph: hyperAnalysis
      },
      neural_network: {
        architecture_summary: {
          name: hgnn.architecture.name,
          layers: hgnn.architecture.layers.length,
          total_parameters: hgnn.architecture.layers.reduce((sum, l, i) => {
            if (i === 0) return 0;
            return sum + (hgnn.architecture.layers[i-1].dimension * l.dimension);
          }, 0)
        },
        feature_dimensions: {
          nodes: hgnn.feature_matrix.nodes.length,
          features: hgnn.feature_matrix.feature_names.length
        },
        training_readiness: {
          ready: true,
          adjacency_tensors: Object.keys(hgnn.adjacency_tensors).length,
          training_config: hgnn.training_config
        }
      },
      insights: {
        critical_nodes: criticalNodes,
        bottlenecks: bottlenecks,
        recommendations: recommendations
      }
    };
    
    console.log(`  Critical nodes identified: ${criticalNodes.length}`);
    console.log(`  Bottlenecks detected: ${bottlenecks.length}`);
    console.log(`  Recommendations: ${recommendations.length}`);
    
    return report;
  }
  
  /**
   * Save report to file
   */
  saveReport(report: ForensicAnalysisReport, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n✓ Forensic report saved to: ${outputPath}`);
  }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

function exportGraphs(
  rsGraph: Graph,
  rawGraph: Graph,
  hyperGraph: HyperGraph,
  hgnn: HyperGraphNeuralNetwork,
  cosingHyperGraph: COSINGHyperGraph | null,
  outputDir: string
): void {
  console.log('\n=== Exporting Graph Data ===');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Export graphs
  fs.writeFileSync(
    path.join(outputDir, 'RSGraph.json'),
    JSON.stringify({
      metadata: rsGraph.metadata,
      nodes: Array.from(rsGraph.nodes.values()),
      edges: rsGraph.edges
    }, null, 2)
  );
  console.log('  ✓ RSGraph.json');
  
  fs.writeFileSync(
    path.join(outputDir, 'RAWGraph.json'),
    JSON.stringify({
      metadata: rawGraph.metadata,
      nodes: Array.from(rawGraph.nodes.values()),
      edges: rawGraph.edges
    }, null, 2)
  );
  console.log('  ✓ RAWGraph.json');
  
  fs.writeFileSync(
    path.join(outputDir, 'RAWSHyperGraph.json'),
    JSON.stringify({
      metadata: hyperGraph.metadata,
      nodes: Array.from(hyperGraph.nodes.values()),
      edges: hyperGraph.edges,
      layers: {
        supply_chain: {
          metadata: hyperGraph.layers.supply_chain.metadata,
          node_count: hyperGraph.layers.supply_chain.nodes.size,
          edge_count: hyperGraph.layers.supply_chain.edges.length
        },
        formulation: {
          metadata: hyperGraph.layers.formulation.metadata,
          node_count: hyperGraph.layers.formulation.nodes.size,
          edge_count: hyperGraph.layers.formulation.edges.length
        }
      },
      cross_layer_edges: hyperGraph.cross_layer_edges
    }, null, 2)
  );
  console.log('  ✓ RAWSHyperGraph.json');
  
  // Export neural network
  fs.writeFileSync(
    path.join(outputDir, 'RAWSHGNN.json'),
    JSON.stringify(hgnn, null, 2)
  );
  console.log('  ✓ RAWSHGNN.json');
  
  // Export adjacency matrices as CSV for visualization
  const exportAdjacencyCSV = (matrix: number[][], filename: string) => {
    const csv = matrix.map(row => row.join(',')).join('\n');
    fs.writeFileSync(path.join(outputDir, filename), csv);
  };
  
  exportAdjacencyCSV(hgnn.adjacency_tensors.supply_chain, 'adjacency_supply_chain.csv');
  exportAdjacencyCSV(hgnn.adjacency_tensors.formulation, 'adjacency_formulation.csv');
  exportAdjacencyCSV(hgnn.adjacency_tensors.cross_layer, 'adjacency_cross_layer.csv');
  console.log('  ✓ Adjacency matrices (CSV)');
  
  // Export COSING HyperGraph if available
  if (cosingHyperGraph) {
    const cosingData = {
      metadata: cosingHyperGraph.metadata,
      nodes: Array.from(cosingHyperGraph.nodes.values()),
      edges: cosingHyperGraph.edges,
      function_groups: Array.from(cosingHyperGraph.function_groups.entries()).map(([func, ingSet]) => ({
        function: func,
        ingredients: Array.from(ingSet)
      })),
      formulation_types: cosingHyperGraph.formulation_types,
      cosing_metadata: cosingHyperGraph.cosing_metadata
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'COSINGHyperGraph.json'),
      JSON.stringify(cosingData, null, 2)
    );
    console.log('  ✓ COSINGHyperGraph.json');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  SKIN-TWIN FORENSIC HYPERGRAPH ANALYSIS & NEURAL NETWORK      ║');
  console.log('║  Comprehensive Graph Construction and RAWSHGNN Mapping        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  try {
    // Initialize components
    const builder = new GraphBuilder();
    const analyzer = new GraphAnalyzer();
    const nnMapper = new HyperGraphNeuralNetworkMapper();
    const reportGenerator = new ForensicReportGenerator();
    const cosingBuilder = new COSINGHyperGraphBuilder();
    
    // Step 1: Build graphs
    const rsGraph = builder.buildRSGraph();
    const rawGraph = builder.buildRAWGraph();
    const hyperGraph = builder.buildRAWSHyperGraph(rsGraph, rawGraph);
    
    // Step 2: Build COSING HyperGraph
    let cosingHyperGraph: COSINGHyperGraph | null = null;
    try {
      cosingHyperGraph = cosingBuilder.buildCOSINGHyperGraph(hyperGraph);
    } catch (error) {
      console.warn('  ⚠ Could not build COSINGHyperGraph:', (error as Error).message);
    }
    
    // Step 3: Analyze graphs
    const rsAnalysis = analyzer.analyzeGraph(rsGraph);
    const rawAnalysis = analyzer.analyzeGraph(rawGraph);
    const hyperAnalysis = analyzer.analyzeHyperGraph(hyperGraph);
    
    // Step 4: Map to neural network
    const hgnn = nnMapper.mapToNeuralNetwork(hyperGraph);
    
    // Step 5: Generate forensic report
    const report = reportGenerator.generateReport(
      rsGraph,
      rawGraph,
      hyperGraph,
      rsAnalysis,
      rawAnalysis,
      hyperAnalysis,
      hgnn
    );
    
    // Step 6: Export all data
    const outputDir = path.join(process.cwd(), 'vessels', 'database', 'hypergraph');
    exportGraphs(rsGraph, rawGraph, hyperGraph, hgnn, cosingHyperGraph, outputDir);
    
    const reportPath = path.join(outputDir, 'forensic_analysis_report.json');
    reportGenerator.saveReport(report, reportPath);
    
    // Generate summary markdown
    const summaryPath = path.join(outputDir, 'FORENSIC_ANALYSIS_SUMMARY.md');
    const summary = generateMarkdownSummary(report, rsGraph, rawGraph, hyperGraph, hgnn, cosingHyperGraph);
    fs.writeFileSync(summaryPath, summary);
    console.log(`✓ Summary saved to: ${summaryPath}`);
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  FORENSIC ANALYSIS COMPLETE                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\n📊 Graphs Built: RSGraph, RAWGraph, RAWSHyperGraph${cosingHyperGraph ? ', COSINGHyperGraph' : ''}`);
    console.log(`🧠 Neural Network: RAWSHGNN (${hgnn.architecture.layers.length} layers)`);
    if (cosingHyperGraph) {
      console.log(`🔬 COSING Analysis: ${cosingHyperGraph.formulation_types.total_combinations} formulation types identified`);
    }
    console.log(`📁 Output: ${outputDir}`);
    
  } catch (error) {
    console.error('\n❌ Error during forensic analysis:', error);
    process.exit(1);
  }
}

function generateMarkdownSummary(
  report: ForensicAnalysisReport,
  rsGraph: Graph,
  rawGraph: Graph,
  hyperGraph: HyperGraph,
  hgnn: HyperGraphNeuralNetwork,
  cosingHyperGraph: COSINGHyperGraph | null
): string {
  let cosingSection = '';
  
  if (cosingHyperGraph) {
    const topPatterns = cosingHyperGraph.formulation_types.formulation_patterns
      .slice(0, 5)
      .map((p, i) => `${i + 1}. **${p.functions.join(', ')}** - ${p.count} products`)
      .join('\n');
    
    const functionDistribution = Object.entries(cosingHyperGraph.formulation_types.function_distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([func, count]) => `- **${func}**: ${count} ingredients`)
      .join('\n');
    
    cosingSection = `
## COSINGHyperGraph Analysis

### Formulation Type Estimation

The COSINGHyperGraph provides a functional analysis of formulations by grouping ingredients based on their COSING-defined functions. This enables estimation of formulation type diversity and complexity.

#### Key Statistics
- **Total Formulation Types:** ${cosingHyperGraph.formulation_types.total_combinations}
- **Mapped Ingredients:** ${cosingHyperGraph.cosing_metadata.mapped_ingredients}
- **Unmapped Ingredients:** ${cosingHyperGraph.cosing_metadata.unmapped_ingredients}
- **Mapping Coverage:** ${((cosingHyperGraph.cosing_metadata.mapped_ingredients / (cosingHyperGraph.cosing_metadata.mapped_ingredients + cosingHyperGraph.cosing_metadata.unmapped_ingredients)) * 100).toFixed(2)}%

#### Formulation Type Interpretation

A "formulation type" is defined as a unique combination of ingredient functions. For example:
- Type A: Emollient + Humectant + Preservative
- Type B: Active + Emollient + Emulsifier + Preservative

The system identified **${cosingHyperGraph.formulation_types.total_combinations} distinct formulation types** across the product catalog. This represents the diversity of formulation architectures being used.

#### Top Formulation Patterns
${topPatterns}

#### Function Distribution
${functionDistribution}

#### Formulation Complexity Insights

The formulation type count (${cosingHyperGraph.formulation_types.total_combinations}) represents:
1. **Formulation Diversity**: ${cosingHyperGraph.formulation_types.total_combinations} unique functional architectures
2. **Innovation Potential**: Additional combinations of functions could yield new formulation types
3. **Optimization Opportunities**: Products sharing the same formulation type can be optimized together

`;
  }
  
  return `# SKIN-TWIN Forensic Hypergraph Analysis Report

**Generated:** ${new Date().toISOString()}

## Executive Summary

This report presents a comprehensive forensic analysis of the SKIN-TWIN hypergraph architecture, constructing and analyzing the RSGraph (Supply Chain), RAWGraph (Formulation), and their integration into the RAWSHyperGraph. Additionally, we map this hypergraph to a HyperGraph Neural Network (RAWSHGNN) for advanced analytics.${cosingHyperGraph ? ' The COSINGHyperGraph provides functional analysis and formulation type estimation.' : ''}

## Graph Construction

### RSGraph (Supply Chain Network)
- **Nodes:** ${rsGraph.metadata.node_count}
- **Edges:** ${rsGraph.metadata.edge_count}
- **Density:** ${rsGraph.metadata.density.toFixed(4)}
- **Description:** ${rsGraph.metadata.description}

### RAWGraph (Formulation Network)
- **Nodes:** ${rawGraph.metadata.node_count}
- **Edges:** ${rawGraph.metadata.edge_count}
- **Density:** ${rawGraph.metadata.density.toFixed(4)}
- **Description:** ${rawGraph.metadata.description}

### RAWSHyperGraph (Integrated Network)
- **Total Nodes:** ${hyperGraph.metadata.node_count}
- **Total Edges:** ${hyperGraph.metadata.edge_count}
- **Density:** ${hyperGraph.metadata.density.toFixed(4)}
- **Shared Ingredients:** ${report.graphs.rawsh_hypergraph.layer_integration.shared_ingredients}
- **Integration Strength:** ${(report.graphs.rawsh_hypergraph.cross_layer_analysis.integration_strength * 100).toFixed(2)}%

## Network Analysis

### Critical Nodes (Top 5)
${report.insights.critical_nodes.slice(0, 5).map((node, i) => 
  `${i + 1}. **${node.label}** (${node.type}) - Importance: ${node.importance.toFixed(3)}`
).join('\n')}

### Vulnerability Assessment
- **Single Point Failures:** ${report.graphs.rs_graph.vulnerability_assessment.single_point_failures}
- **Bottlenecks:** ${report.insights.bottlenecks.length} critical suppliers identified

### Community Structure
- **RSGraph Communities:** ${report.graphs.rs_graph.community_structure.num_communities}
- **RAWGraph Communities:** ${report.graphs.raw_graph.community_structure.num_communities}

## HyperGraph Neural Network (RAWSHGNN)

### Architecture
- **Model Type:** ${hgnn.architecture.type}
- **Total Layers:** ${hgnn.architecture.layers.length}
- **Total Parameters:** ~${report.neural_network.architecture_summary.total_parameters.toLocaleString()}

### Layer Configuration
${hgnn.architecture.layers.map(layer => 
  `- **${layer.name}** (${layer.type}): Dimension ${layer.dimension}, Activation: ${layer.activation}, Nodes: ${layer.nodes.length}`
).join('\n')}

### Feature Space
- **Node Features:** ${hgnn.feature_matrix.feature_names.length}
- **Feature Names:** ${hgnn.feature_matrix.feature_names.join(', ')}
- **Total Nodes:** ${hgnn.feature_matrix.nodes.length}

### Adjacency Tensors
- **Supply Chain Matrix:** ${hgnn.adjacency_tensors.supply_chain.length} × ${hgnn.adjacency_tensors.supply_chain.length}
- **Formulation Matrix:** ${hgnn.adjacency_tensors.formulation.length} × ${hgnn.adjacency_tensors.formulation.length}
- **Cross-Layer Matrix:** ${hgnn.adjacency_tensors.cross_layer.length} × ${hgnn.adjacency_tensors.cross_layer.length}

### Training Configuration
- **Learning Rate:** ${hgnn.training_config.learning_rate}
- **Epochs:** ${hgnn.training_config.epochs}
- **Batch Size:** ${hgnn.training_config.batch_size}
- **Loss Function:** ${hgnn.training_config.loss_function}
- **Optimizer:** ${hgnn.training_config.optimizer}

${cosingSection}

## Key Insights & Recommendations

${report.insights.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Network Metrics Summary

| Metric | RSGraph | RAWGraph | RAWSHyperGraph |
|--------|---------|----------|----------------|
| Nodes | ${report.graphs.rs_graph.basic_stats.nodes} | ${report.graphs.raw_graph.basic_stats.nodes} | ${report.graphs.rawsh_hypergraph.basic_stats.nodes} |
| Edges | ${report.graphs.rs_graph.basic_stats.edges} | ${report.graphs.raw_graph.basic_stats.edges} | ${report.graphs.rawsh_hypergraph.basic_stats.edges} |
| Density | ${report.graphs.rs_graph.basic_stats.density.toFixed(4)} | ${report.graphs.raw_graph.basic_stats.density.toFixed(4)} | ${report.graphs.rawsh_hypergraph.basic_stats.density.toFixed(4)} |
| Avg Degree | ${report.graphs.rs_graph.basic_stats.average_degree.toFixed(2)} | ${report.graphs.raw_graph.basic_stats.average_degree.toFixed(2)} | ${report.graphs.rawsh_hypergraph.basic_stats.average_degree.toFixed(2)} |

## Exported Files

- \`RSGraph.json\` - Supply Chain Network
- \`RAWGraph.json\` - Formulation Network
- \`RAWSHyperGraph.json\` - Integrated Hypergraph
- \`RAWSHGNN.json\` - Neural Network Architecture
- \`adjacency_supply_chain.csv\` - Supply Chain Adjacency Matrix
- \`adjacency_formulation.csv\` - Formulation Adjacency Matrix
- \`adjacency_cross_layer.csv\` - Cross-Layer Adjacency Matrix
- \`forensic_analysis_report.json\` - Complete Analysis Report${cosingHyperGraph ? '\n- `COSINGHyperGraph.json` - Function-Based Formulation Type Analysis' : ''}

## Conclusion

The forensic analysis reveals a complex, multi-layered hypergraph structure with ${hyperGraph.metadata.node_count} nodes and ${hyperGraph.metadata.edge_count} edges. The RAWSHGNN architecture provides a foundation for advanced machine learning applications including:

- Formulation optimization
- Supply chain risk prediction
- Ingredient substitution recommendations
- Product performance prediction
- Cost optimization${cosingHyperGraph ? '\n- Function-based formulation type exploration (' + cosingHyperGraph.formulation_types.total_combinations + ' types identified)' : ''}

**Status:** ✅ Ready for deployment and training

---
*SKIN-TWIN Forensic Analysis System - ${new Date().getFullYear()}*
`;
}

// Execute main function
main();
