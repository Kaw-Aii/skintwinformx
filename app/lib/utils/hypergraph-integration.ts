/**
 * Hypergraph Integration Utility
 * 
 * This module provides utilities for integrating the vessels data with hypergraph analysis.
 * It supports both in-memory analysis and database-backed analysis.
 */

import { createScopedLogger } from '~/utils/logger';
import { executeNeonQuery } from './neon-connection';
import { executeSupabaseQuery } from './supabase-connection';

const logger = createScopedLogger('hypergraph-integration');

/**
 * Types for hypergraph nodes and edges
 */
export interface HypergraphNode {
  id: string;
  type: 'ingredient' | 'formulation' | 'product' | 'supplier';
  label: string;
  properties: Record<string, any>;
}

export interface HypergraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface Hypergraph {
  nodes: HypergraphNode[];
  edges: HypergraphEdge[];
}

/**
 * Builds a hypergraph from the vessels data in memory
 */
export async function buildHypergraphFromVessels(vesselsDbPath: string): Promise<Hypergraph> {
  try {
    logger.debug('Building hypergraph from vessels data');
    
    // Load the vessels database
    const vesselsDb = await import(vesselsDbPath);
    
    const nodes: HypergraphNode[] = [];
    const edges: HypergraphEdge[] = [];
    
    // Add ingredient nodes
    for (const [id, ingredient] of Object.entries(vesselsDb.ingredients.entries)) {
      nodes.push({
        id,
        type: 'ingredient',
        label: ingredient.inciName,
        properties: {
          casNumber: ingredient.casNumber,
          functions: ingredient.functions,
          safetyRating: ingredient.safetyRating,
          usageFrequency: ingredient.usageFrequency,
        },
      });
    }
    
    // Add formulation nodes
    for (const [id, formulation] of Object.entries(vesselsDb.formulations.entries)) {
      nodes.push({
        id,
        type: 'formulation',
        label: formulation.name,
        properties: {
          type: formulation.type,
          ingredientCount: formulation.ingredientCount,
          complexityScore: formulation.complexityScore,
        },
      });
    }
    
    // Add product nodes
    for (const [id, product] of Object.entries(vesselsDb.products.entries)) {
      nodes.push({
        id,
        type: 'product',
        label: product.name,
        properties: {
          category: product.category,
          targetMarket: product.targetMarket,
          benefits: product.benefits,
        },
      });
    }
    
    // Add supplier nodes
    for (const [id, supplier] of Object.entries(vesselsDb.suppliers.entries)) {
      nodes.push({
        id,
        type: 'supplier',
        label: supplier.name,
        properties: {
          code: supplier.code,
          regionsServed: supplier.regionsServed,
          specialties: supplier.specialties,
        },
      });
    }
    
    // Add ingredient-to-formulation edges
    for (const [source, targets] of Object.entries(vesselsDb.relationships.ingredientToFormulation)) {
      for (const target of targets) {
        edges.push({
          id: `${source}-${target}`,
          source,
          target,
          type: 'USED_IN',
          properties: {},
        });
      }
    }
    
    // Add formulation-to-product edges
    for (const [source, targets] of Object.entries(vesselsDb.relationships.formulationToProduct)) {
      for (const target of targets) {
        edges.push({
          id: `${source}-${target}`,
          source,
          target,
          type: 'FORMULATES',
          properties: {},
        });
      }
    }
    
    // Add ingredient-to-supplier edges
    for (const [source, targets] of Object.entries(vesselsDb.relationships.ingredientToSupplier)) {
      for (const target of targets) {
        edges.push({
          id: `${source}-${target}`,
          source,
          target,
          type: 'SUPPLIED_BY',
          properties: {},
        });
      }
    }
    
    // Add incompatibility edges
    for (const [source, targets] of Object.entries(vesselsDb.relationships.incompatibilities)) {
      for (const target of targets) {
        edges.push({
          id: `${source}-${target}-incompatible`,
          source,
          target,
          type: 'INCOMPATIBLE_WITH',
          properties: {},
        });
      }
    }
    
    // Add substitution edges
    for (const [source, targets] of Object.entries(vesselsDb.relationships.substitutions)) {
      for (const target of targets) {
        edges.push({
          id: `${source}-${target}-substitute`,
          source,
          target,
          type: 'SUBSTITUTES',
          properties: {},
        });
      }
    }
    
    logger.debug(`Built hypergraph with ${nodes.length} nodes and ${edges.length} edges`);
    
    return { nodes, edges };
  } catch (error) {
    logger.error('Error building hypergraph from vessels data:', error);
    throw error;
  }
}

/**
 * Builds a hypergraph from the database
 */
export async function buildHypergraphFromDatabase(
  databaseType: 'neon' | 'supabase',
  options: any = {}
): Promise<Hypergraph> {
  try {
    logger.debug(`Building hypergraph from ${databaseType} database`);
    
    const nodes: HypergraphNode[] = [];
    const edges: HypergraphEdge[] = [];
    
    // Query function based on database type
    const executeQuery = databaseType === 'neon' 
      ? (query: string, params: any[] = []) => executeNeonQuery(options, query, params)
      : (query: string, params: any[] = []) => executeSupabaseQuery(options, query, params);
    
    // Get ingredients
    const ingredients = await executeQuery(`
      SELECT id, inci_name, cas_number, functions, safety_rating, usage_frequency
      FROM ingredients
    `);
    
    for (const ingredient of ingredients) {
      nodes.push({
        id: ingredient.id,
        type: 'ingredient',
        label: ingredient.inci_name,
        properties: {
          casNumber: ingredient.cas_number,
          functions: ingredient.functions,
          safetyRating: ingredient.safety_rating,
          usageFrequency: ingredient.usage_frequency,
        },
      });
    }
    
    // Get formulations
    const formulations = await executeQuery(`
      SELECT id, name, type, ingredient_count, complexity_score
      FROM formulations
    `);
    
    for (const formulation of formulations) {
      nodes.push({
        id: formulation.id,
        type: 'formulation',
        label: formulation.name,
        properties: {
          type: formulation.type,
          ingredientCount: formulation.ingredient_count,
          complexityScore: formulation.complexity_score,
        },
      });
    }
    
    // Get products
    const products = await executeQuery(`
      SELECT id, name, category, target_market, benefits
      FROM products
    `);
    
    for (const product of products) {
      nodes.push({
        id: product.id,
        type: 'product',
        label: product.name,
        properties: {
          category: product.category,
          targetMarket: product.target_market,
          benefits: product.benefits,
        },
      });
    }
    
    // Get suppliers
    const suppliers = await executeQuery(`
      SELECT id, name, code, regions_served, specialties
      FROM suppliers
    `);
    
    for (const supplier of suppliers) {
      nodes.push({
        id: supplier.id,
        type: 'supplier',
        label: supplier.name,
        properties: {
          code: supplier.code,
          regionsServed: supplier.regions_served,
          specialties: supplier.specialties,
        },
      });
    }
    
    // Get ingredient usage edges
    const ingredientUsage = await executeQuery(`
      SELECT ingredient_id, formulation_id, concentration
      FROM ingredient_usage
    `);
    
    for (const usage of ingredientUsage) {
      edges.push({
        id: `${usage.ingredient_id}-${usage.formulation_id}`,
        source: usage.ingredient_id,
        target: usage.formulation_id,
        type: 'USED_IN',
        properties: {
          concentration: usage.concentration,
        },
      });
    }
    
    logger.debug(`Built hypergraph with ${nodes.length} nodes and ${edges.length} edges`);
    
    return { nodes, edges };
  } catch (error) {
    logger.error(`Error building hypergraph from ${databaseType} database:`, error);
    throw error;
  }
}

/**
 * Calculates network metrics for a hypergraph
 */
export function calculateNetworkMetrics(graph: Hypergraph): Record<string, any> {
  try {
    logger.debug('Calculating network metrics');
    
    // Node counts by type
    const nodeCounts = {
      ingredient: 0,
      formulation: 0,
      product: 0,
      supplier: 0,
    };
    
    for (const node of graph.nodes) {
      nodeCounts[node.type]++;
    }
    
    // Edge counts by type
    const edgeCounts: Record<string, number> = {};
    
    for (const edge of graph.edges) {
      edgeCounts[edge.type] = (edgeCounts[edge.type] || 0) + 1;
    }
    
    // Calculate degree for each node
    const degrees: Record<string, { in: number; out: number; total: number }> = {};
    
    for (const node of graph.nodes) {
      degrees[node.id] = { in: 0, out: 0, total: 0 };
    }
    
    for (const edge of graph.edges) {
      if (degrees[edge.source]) {
        degrees[edge.source].out++;
        degrees[edge.source].total++;
      }
      
      if (degrees[edge.target]) {
        degrees[edge.target].in++;
        degrees[edge.target].total++;
      }
    }
    
    // Find nodes with highest degree
    const highestDegreeNodes = Object.entries(degrees)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([id, degree]) => {
        const node = graph.nodes.find(n => n.id === id);
        return {
          id,
          label: node?.label || id,
          type: node?.type || 'unknown',
          degree: degree.total,
          inDegree: degree.in,
          outDegree: degree.out,
        };
      });
    
    // Calculate basic network statistics
    const networkStats = {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      density: graph.edges.length / (graph.nodes.length * (graph.nodes.length - 1)),
      averageDegree: Object.values(degrees).reduce((sum, d) => sum + d.total, 0) / graph.nodes.length,
    };
    
    return {
      nodeCounts,
      edgeCounts,
      highestDegreeNodes,
      networkStats,
    };
  } catch (error) {
    logger.error('Error calculating network metrics:', error);
    throw error;
  }
}

/**
 * Identifies critical nodes in the hypergraph
 */
export function identifyCriticalNodes(graph: Hypergraph): HypergraphNode[] {
  try {
    logger.debug('Identifying critical nodes');
    
    // Calculate degree for each node
    const degrees: Record<string, number> = {};
    
    for (const edge of graph.edges) {
      degrees[edge.source] = (degrees[edge.source] || 0) + 1;
      degrees[edge.target] = (degrees[edge.target] || 0) + 1;
    }
    
    // Find nodes with highest degree (top 5%)
    const threshold = Math.floor(graph.nodes.length * 0.05);
    const criticalNodeIds = Object.entries(degrees)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(threshold, 5))
      .map(([id]) => id);
    
    // Get the actual node objects
    const criticalNodes = graph.nodes.filter(node => criticalNodeIds.includes(node.id));
    
    logger.debug(`Identified ${criticalNodes.length} critical nodes`);
    
    return criticalNodes;
  } catch (error) {
    logger.error('Error identifying critical nodes:', error);
    throw error;
  }
}
