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

// Type definitions for vessels database entries
interface VesselsDbEntry {
  inciName?: string;
  casNumber?: string;
  functions?: string[];
  safetyRating?: string;
  usageFrequency?: number;
  name?: string;
  type?: string;
  ingredientCount?: number;
  complexityScore?: number;
  targetBenefits?: string[];
  category?: string;
  targetMarket?: string;
  benefits?: string[];
  code?: string;
  regionsServed?: string[];
  specialties?: string[];
}

interface VesselsDb {
  ingredients: { entries: Record<string, VesselsDbEntry> };
  formulations: { entries: Record<string, VesselsDbEntry> };
  products: { entries: Record<string, VesselsDbEntry> };
  suppliers: { entries: Record<string, VesselsDbEntry> };
}

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

export interface HypergraphData {
  nodes: HypergraphNode[];
  edges: HypergraphEdge[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    generatedAt: string;
  };
}

/**
 * Builds a hypergraph from the vessels data in memory
 */
export async function buildHypergraphFromVessels(vesselsDbPath: string): Promise<Hypergraph> {
  try {
    logger.debug('Building hypergraph from vessels data');
    
    // Load the vessels database
    const vesselsDb = await import(vesselsDbPath) as VesselsDb;
    
    return generateHypergraphFromVessels(vesselsDb);
  } catch (error) {
    logger.error('Failed to build hypergraph from vessels:', error);
    throw error;
  }
}

export function generateHypergraphFromVessels(vesselsDb: VesselsDb): HypergraphData {
  const nodes: HypergraphNode[] = [];
  const edges: HypergraphEdge[] = [];
  
  // Add ingredient nodes
  for (const [id, ingredient] of Object.entries(vesselsDb.ingredients?.entries || {})) {
    if (ingredient?.inciName) {
      nodes.push({
        id,
        type: 'ingredient',
        label: ingredient.inciName,
        properties: {
          casNumber: ingredient.casNumber || '',
          functions: ingredient.functions || [],
          safetyRating: ingredient.safetyRating || '',
          usageFrequency: ingredient.usageFrequency || 0,
        },
      });
    }
  }
  
  // Add formulation nodes
  for (const [id, formulation] of Object.entries(vesselsDb.formulations?.entries || {})) {
    if (formulation?.name) {
      nodes.push({
        id,
        type: 'formulation',
        label: formulation.name,
        properties: {
          type: formulation.type || '',
          ingredientCount: formulation.ingredientCount || 0,
          complexityScore: formulation.complexityScore || 0,
          targetBenefits: formulation.targetBenefits || [],
        },
      });
    }
  }
  
  // Add product nodes
  for (const [id, product] of Object.entries(vesselsDb.products?.entries || {})) {
    if (product?.name) {
      nodes.push({
        id,
        type: 'product',
        label: product.name,
        properties: {
          category: product.category || '',
          targetMarket: product.targetMarket || '',
          benefits: product.benefits || [],
        },
      });
    }
  }
  
  // Add supplier nodes
  for (const [id, supplier] of Object.entries(vesselsDb.suppliers?.entries || {})) {
    if (supplier?.name) {
      nodes.push({
        id,
        type: 'supplier',
        label: supplier.name,
        properties: {
          code: supplier.code || '',
          regionsServed: supplier.regionsServed || [],
          specialties: supplier.specialties || [],
        },
      });
    }
  }
  
  // Generate edges based on relationships
  generateHypergraphEdges(vesselsDb, nodes, edges);
  
  return {
    nodes,
    edges,
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

function generateHypergraphEdges(
  vesselsDb: VesselsDb,
  nodes: HypergraphNode[],
  edges: HypergraphEdge[]
): void {
  // Add ingredient-to-formulation edges
  const ingredientTargets = vesselsDb.formulations?.entries || {};
  for (const [formulationId, targets] of Object.entries(ingredientTargets)) {
    if (Array.isArray(targets)) {
      for (const target of targets) {
        if (typeof target === 'object' && target !== null && 'ingredientId' in target) {
          edges.push({
            id: `ingredient-${target.ingredientId}-formulation-${formulationId}`,
            source: target.ingredientId as string,
            target: formulationId,
            type: 'contains',
            properties: {
              concentration: target.concentration || 0,
              function: target.function || '',
            },
          });
        }
      }
    }
  }
  
  // Add formulation-to-product edges
  const formulationTargets = vesselsDb.products?.entries || {};
  for (const [productId, targets] of Object.entries(formulationTargets)) {
    if (Array.isArray(targets)) {
      for (const target of targets) {
        if (typeof target === 'object' && target !== null && 'formulationId' in target) {
          edges.push({
            id: `formulation-${target.formulationId}-product-${productId}`,
            source: target.formulationId as string,
            target: productId,
            type: 'implements',
            properties: {
              version: target.version || '1.0',
            },
          });
        }
      }
    }
  }
  
  // Add supplier-to-ingredient edges
  const supplierTargets = vesselsDb.ingredients?.entries || {};
  for (const [ingredientId, targets] of Object.entries(supplierTargets)) {
    if (Array.isArray(targets)) {
      for (const target of targets) {
        if (typeof target === 'object' && target !== null && 'supplierId' in target) {
          edges.push({
            id: `supplier-${target.supplierId}-ingredient-${ingredientId}`,
            source: target.supplierId as string,
            target: ingredientId,
            type: 'supplies',
            properties: {
              price: target.price || 0,
              availability: target.availability || 'unknown',
            },
          });
        }
      }
    }
  }
  
  // Add product-to-market edges
  const marketTargets = vesselsDb.products?.entries || {};
  for (const [productId, targets] of Object.entries(marketTargets)) {
    if (Array.isArray(targets)) {
      for (const target of targets) {
        if (typeof target === 'object' && target !== null && 'marketId' in target) {
          edges.push({
            id: `product-${productId}-market-${target.marketId}`,
            source: productId,
            target: target.marketId as string,
            type: 'targets',
            properties: {
              segment: target.segment || '',
              priority: target.priority || 'medium',
            },
          });
        }
      }
    }
  }
  
  // Add regulatory compliance edges
  const regulatoryTargets = vesselsDb.formulations?.entries || {};
  for (const [formulationId, targets] of Object.entries(regulatoryTargets)) {
    if (Array.isArray(targets)) {
      for (const target of targets) {
        if (typeof target === 'object' && target !== null && 'regulatoryId' in target) {
          edges.push({
            id: `formulation-${formulationId}-regulatory-${target.regulatoryId}`,
            source: formulationId,
            target: target.regulatoryId as string,
            type: 'complies_with',
            properties: {
              status: target.status || 'pending',
              region: target.region || 'global',
            },
          });
        }
      }
    }
  }
}

/**
 * Synchronizes hypergraph data with Neon database
 */
export async function syncHypergraphToNeon(hypergraph: HypergraphData): Promise<void> {
  try {
    logger.debug('Syncing hypergraph to Neon database');
    
    // Clear existing hypergraph data
    await executeNeonQuery({}, 'DELETE FROM hypergraph_nodes');
    await executeNeonQuery({}, 'DELETE FROM hypergraph_edges');
    
    // Insert nodes
    for (const node of hypergraph.nodes) {
      await executeNeonQuery(
        {},
        'INSERT INTO hypergraph_nodes (id, type, label, properties) VALUES ($1, $2, $3, $4)',
        [node.id, node.type, node.label, JSON.stringify(node.properties)]
      );
    }
    
    // Insert edges
    for (const edge of hypergraph.edges) {
      await executeNeonQuery(
        {},
        'INSERT INTO hypergraph_edges (id, source, target, type, properties) VALUES ($1, $2, $3, $4, $5)',
        [edge.id, edge.source, edge.target, edge.type, JSON.stringify(edge.properties)]
      );
    }
    
    logger.info(`Synced ${hypergraph.nodes.length} nodes and ${hypergraph.edges.length} edges to Neon`);
  } catch (error) {
    logger.error('Failed to sync hypergraph to Neon:', error);
    throw error;
  }
}

/**
 * Synchronizes hypergraph data with Supabase database
 */
export async function syncHypergraphToSupabase(hypergraph: HypergraphData): Promise<void> {
  try {
    logger.debug('Syncing hypergraph to Supabase database');
    
    // Clear existing hypergraph data
    await executeSupabaseQuery({}, 'DELETE FROM hypergraph_nodes');
    await executeSupabaseQuery({}, 'DELETE FROM hypergraph_edges');
    
    // Insert nodes
    for (const node of hypergraph.nodes) {
      await executeSupabaseQuery(
        {},
        'INSERT INTO hypergraph_nodes (id, type, label, properties) VALUES ($1, $2, $3, $4)',
        [node.id, node.type, node.label, JSON.stringify(node.properties)]
      );
    }
    
    // Insert edges
    for (const edge of hypergraph.edges) {
      await executeSupabaseQuery(
        {},
        'INSERT INTO hypergraph_edges (id, source, target, type, properties) VALUES ($1, $2, $3, $4, $5)',
        [edge.id, edge.source, edge.target, edge.type, JSON.stringify(edge.properties)]
      );
    }
    
    logger.info(`Synced ${hypergraph.nodes.length} nodes and ${hypergraph.edges.length} edges to Supabase`);
  } catch (error) {
    logger.error('Failed to sync hypergraph to Supabase:', error);
    throw error;
  }
}

/**
 * Analyzes hypergraph structure and returns insights
 */
export function analyzeHypergraph(hypergraph: HypergraphData): Record<string, any> {
  const analysis = {
    nodeTypes: {} as Record<string, number>,
    edgeTypes: {} as Record<string, number>,
    connectivity: {
      averageDegree: 0,
      maxDegree: 0,
      minDegree: Infinity,
    },
    clusters: [] as string[][],
    centralNodes: [] as { id: string; degree: number }[],
  };
  
  // Count node types
  for (const node of hypergraph.nodes) {
    analysis.nodeTypes[node.type] = (analysis.nodeTypes[node.type] || 0) + 1;
  }
  
  // Count edge types
  for (const edge of hypergraph.edges) {
    analysis.edgeTypes[edge.type] = (analysis.edgeTypes[edge.type] || 0) + 1;
  }
  
  // Calculate node degrees
  const nodeDegrees = new Map<string, number>();
  for (const edge of hypergraph.edges) {
    nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1);
    nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1);
  }
  
  // Calculate connectivity metrics
  const degrees = Array.from(nodeDegrees.values());
  if (degrees.length > 0) {
    analysis.connectivity.averageDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    analysis.connectivity.maxDegree = Math.max(...degrees);
    analysis.connectivity.minDegree = Math.min(...degrees);
  }
  
  // Find central nodes (top 10 by degree)
  analysis.centralNodes = Array.from(nodeDegrees.entries())
    .map(([id, degree]) => ({ id, degree }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10);
  
  return analysis;
}
