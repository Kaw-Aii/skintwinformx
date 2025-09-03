/**
 * Comprehensive Database Builder for SKIN-TWIN Vessels
 * Consolidates all data sources into a unified database
 */

import type { FormulationSchema } from '~/types/vessels';
import type { COSINGIngredient } from './cosing-parser';
import type { PIFDocument } from './pif-parser';

export interface VesselDatabase {
  metadata: {
    version: string;
    created: Date;
    lastUpdated: Date;
    sources: DataSource[];
  };
  ingredients: IngredientDatabase;
  formulations: FormulationDatabase;
  products: ProductDatabase;
  suppliers: SupplierDatabase;
  relationships: RelationshipGraph;
  indices: DatabaseIndices;
}

export interface DataSource {
  type: 'cosing' | 'pif' | 'manual' | 'imported';
  path: string;
  importedAt: Date;
  recordCount: number;
}

export interface IngredientDatabase {
  entries: Map<string, EnhancedIngredient>;
  byFunction: Map<string, string[]>;
  byCAS: Map<string, string>;
  bySupplier: Map<string, string[]>;
  restrictions: Map<string, string[]>;
}

export interface EnhancedIngredient {
  id: string;
  inciName: string;
  casNumbers: string[];
  tradenames: string[];
  functions: string[];
  cosing?: COSINGIngredient;
  usage: {
    frequency: number;
    averageConcentration: number;
    products: string[];
  };
  regulatory: {
    euRestricted: boolean;
    usRestricted: boolean;
    maxConcentration?: number;
    warnings?: string[];
  };
  properties: {
    molecular_weight?: number;
    solubility?: string;
    ph_stability?: { min: number; max: number };
    incompatibilities?: string[];
  };
  sourcing: {
    suppliers: string[];
    priceRange?: { min: number; max: number; currency: string };
    leadTime?: number;
  };
}

export interface FormulationDatabase {
  entries: Map<string, EnhancedFormulation>;
  byType: Map<string, string[]>;
  byStatus: Map<string, string[]>;
  templates: Map<string, FormulationTemplate>;
}

export interface EnhancedFormulation extends FormulationSchema {
  source: DataSource;
  validation: {
    cosingValidated: boolean;
    safetyScore: number;
    issues: string[];
  };
  optimization: {
    costEstimate?: number;
    stabilityRating?: number;
    naturalContent?: number;
  };
  variations: string[];
}

export interface ProductDatabase {
  entries: Map<string, Product>;
  byCategory: Map<string, string[]>;
  byBrand: Map<string, string[]>;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  formulation: string;
  claims: string[];
  packaging: string;
  targetMarket: string[];
}

export interface SupplierDatabase {
  entries: Map<string, Supplier>;
  byIngredient: Map<string, string[]>;
  byRegion: Map<string, string[]>;
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
  ingredients: string[];
  certifications: string[];
  minimumOrder?: number;
  leadTime?: number;
}

export interface RelationshipGraph {
  ingredientToFormulation: Map<string, string[]>;
  formulationToProduct: Map<string, string[]>;
  ingredientToSupplier: Map<string, string[]>;
  incompatibilities: Map<string, string[]>;
  substitutions: Map<string, string[]>;
}

export interface DatabaseIndices {
  searchIndex: Map<string, SearchEntry[]>;
  functionIndex: Map<string, string[]>;
  concentrationIndex: Map<string, ConcentrationRange>;
}

export interface SearchEntry {
  type: 'ingredient' | 'formulation' | 'product' | 'supplier';
  id: string;
  name: string;
  keywords: string[];
}

export interface ConcentrationRange {
  min: number;
  max: number;
  typical: number;
}

export interface FormulationTemplate {
  id: string;
  name: string;
  baseFormulation: string;
  variables: TemplateVariable[];
  constraints: any[];
}

export interface TemplateVariable {
  name: string;
  type: string;
  defaultValue: any;
  range?: { min: number; max: number };
}

/**
 * Build comprehensive vessel database
 */
export async function buildVesselDatabase(config: {
  cosingPath?: string;
  pifPath?: string;
  formulationsPath?: string;
  productsPath?: string;
  suppliersPath?: string;
}): Promise<VesselDatabase> {
  const database: VesselDatabase = {
    metadata: {
      version: '1.0.0',
      created: new Date(),
      lastUpdated: new Date(),
      sources: []
    },
    ingredients: {
      entries: new Map(),
      byFunction: new Map(),
      byCAS: new Map(),
      bySupplier: new Map(),
      restrictions: new Map()
    },
    formulations: {
      entries: new Map(),
      byType: new Map(),
      byStatus: new Map(),
      templates: new Map()
    },
    products: {
      entries: new Map(),
      byCategory: new Map(),
      byBrand: new Map()
    },
    suppliers: {
      entries: new Map(),
      byIngredient: new Map(),
      byRegion: new Map()
    },
    relationships: {
      ingredientToFormulation: new Map(),
      formulationToProduct: new Map(),
      ingredientToSupplier: new Map(),
      incompatibilities: new Map(),
      substitutions: new Map()
    },
    indices: {
      searchIndex: new Map(),
      functionIndex: new Map(),
      concentrationIndex: new Map()
    }
  };
  
  // Process each data source
  if (config.cosingPath) {
    await processCOSINGData(database, config.cosingPath);
  }
  
  if (config.pifPath) {
    await processPIFData(database, config.pifPath);
  }
  
  if (config.formulationsPath) {
    await processFormulations(database, config.formulationsPath);
  }
  
  if (config.productsPath) {
    await processProducts(database, config.productsPath);
  }
  
  if (config.suppliersPath) {
    await processSuppliers(database, config.suppliersPath);
  }
  
  // Build relationships and indices
  buildRelationships(database);
  buildIndices(database);
  
  return database;
}

async function processCOSINGData(database: VesselDatabase, path: string): Promise<void> {
  // Implementation would read and process COSING data
  database.metadata.sources.push({
    type: 'cosing',
    path,
    importedAt: new Date(),
    recordCount: 0
  });
}

async function processPIFData(database: VesselDatabase, path: string): Promise<void> {
  // Implementation would read and process PIF documents
  database.metadata.sources.push({
    type: 'pif',
    path,
    importedAt: new Date(),
    recordCount: 0
  });
}

async function processFormulations(database: VesselDatabase, path: string): Promise<void> {
  // Implementation would read and process formulation files
  database.metadata.sources.push({
    type: 'manual',
    path,
    importedAt: new Date(),
    recordCount: 0
  });
}

async function processProducts(database: VesselDatabase, path: string): Promise<void> {
  // Implementation would read and process product files
  database.metadata.sources.push({
    type: 'imported',
    path,
    importedAt: new Date(),
    recordCount: 0
  });
}

async function processSuppliers(database: VesselDatabase, path: string): Promise<void> {
  // Implementation would read and process supplier files
  database.metadata.sources.push({
    type: 'imported',
    path,
    importedAt: new Date(),
    recordCount: 0
  });
}

function buildRelationships(database: VesselDatabase): void {
  // Build ingredient to formulation relationships
  database.formulations.entries.forEach((formulation, formId) => {
    if (formulation.ingredients) {
      formulation.ingredients.forEach(ingredient => {
        const ingId = ingredient.ingredientId;
        if (!database.relationships.ingredientToFormulation.has(ingId)) {
          database.relationships.ingredientToFormulation.set(ingId, []);
        }
        database.relationships.ingredientToFormulation.get(ingId)!.push(formId);
      });
    }
  });
  
  // Build formulation to product relationships
  database.products.entries.forEach((product, prodId) => {
    const formId = product.formulation;
    if (!database.relationships.formulationToProduct.has(formId)) {
      database.relationships.formulationToProduct.set(formId, []);
    }
    database.relationships.formulationToProduct.get(formId)!.push(prodId);
  });
}

function buildIndices(database: VesselDatabase): void {
  // Build search index
  database.ingredients.entries.forEach((ingredient, id) => {
    const keywords = [
      ingredient.inciName,
      ...ingredient.tradenames,
      ...ingredient.functions
    ].map(k => k.toLowerCase());
    
    keywords.forEach(keyword => {
      if (!database.indices.searchIndex.has(keyword)) {
        database.indices.searchIndex.set(keyword, []);
      }
      database.indices.searchIndex.get(keyword)!.push({
        type: 'ingredient',
        id,
        name: ingredient.inciName,
        keywords
      });
    });
  });
  
  // Build function index
  database.ingredients.entries.forEach((ingredient, id) => {
    ingredient.functions.forEach(func => {
      if (!database.indices.functionIndex.has(func)) {
        database.indices.functionIndex.set(func, []);
      }
      database.indices.functionIndex.get(func)!.push(id);
    });
  });
}

/**
 * Query the vessel database
 */
export class DatabaseQuery {
  constructor(private database: VesselDatabase) {}
  
  findIngredient(query: string): EnhancedIngredient | undefined {
    // Search by INCI name
    if (this.database.ingredients.entries.has(query)) {
      return this.database.ingredients.entries.get(query);
    }
    
    // Search by CAS number
    const byCAS = this.database.ingredients.byCAS.get(query);
    if (byCAS) {
      return this.database.ingredients.entries.get(byCAS);
    }
    
    // Search in index
    const searchResults = this.database.indices.searchIndex.get(query.toLowerCase());
    if (searchResults && searchResults.length > 0) {
      const ingredient = searchResults.find(r => r.type === 'ingredient');
      if (ingredient) {
        return this.database.ingredients.entries.get(ingredient.id);
      }
    }
    
    return undefined;
  }
  
  findFormulation(id: string): EnhancedFormulation | undefined {
    return this.database.formulations.entries.get(id);
  }
  
  findProduct(id: string): Product | undefined {
    return this.database.products.entries.get(id);
  }
  
  findSupplier(id: string): Supplier | undefined {
    return this.database.suppliers.entries.get(id);
  }
  
  getIngredientsByFunction(func: string): string[] {
    return this.database.ingredients.byFunction.get(func) || [];
  }
  
  getFormulationsByType(type: string): string[] {
    return this.database.formulations.byType.get(type) || [];
  }
  
  getIncompatibilities(ingredientId: string): string[] {
    return this.database.relationships.incompatibilities.get(ingredientId) || [];
  }
  
  getSubstitutions(ingredientId: string): string[] {
    return this.database.relationships.substitutions.get(ingredientId) || [];
  }
}

/**
 * Export database to JSON
 */
export function exportDatabaseToJSON(database: VesselDatabase): string {
  const exportData = {
    metadata: database.metadata,
    ingredients: Array.from(database.ingredients.entries.entries()),
    formulations: Array.from(database.formulations.entries.entries()),
    products: Array.from(database.products.entries.entries()),
    suppliers: Array.from(database.suppliers.entries.entries()),
    relationships: {
      ingredientToFormulation: Array.from(database.relationships.ingredientToFormulation.entries()),
      formulationToProduct: Array.from(database.relationships.formulationToProduct.entries()),
      ingredientToSupplier: Array.from(database.relationships.ingredientToSupplier.entries()),
      incompatibilities: Array.from(database.relationships.incompatibilities.entries()),
      substitutions: Array.from(database.relationships.substitutions.entries())
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate database statistics
 */
export function getDatabaseStatistics(database: VesselDatabase): {
  totalIngredients: number;
  totalFormulations: number;
  totalProducts: number;
  totalSuppliers: number;
  ingredientsByFunction: Record<string, number>;
  formulationsByType: Record<string, number>;
  restrictedIngredients: number;
  naturalIngredients: number;
} {
  const ingredientsByFunction: Record<string, number> = {};
  database.ingredients.byFunction.forEach((ingredients, func) => {
    ingredientsByFunction[func] = ingredients.length;
  });
  
  const formulationsByType: Record<string, number> = {};
  database.formulations.byType.forEach((formulations, type) => {
    formulationsByType[type] = formulations.length;
  });
  
  let restrictedCount = 0;
  let naturalCount = 0;
  
  database.ingredients.entries.forEach(ingredient => {
    if (ingredient.regulatory.euRestricted || ingredient.regulatory.usRestricted) {
      restrictedCount++;
    }
    if (ingredient.cosing?.is_natural) {
      naturalCount++;
    }
  });
  
  return {
    totalIngredients: database.ingredients.entries.size,
    totalFormulations: database.formulations.entries.size,
    totalProducts: database.products.entries.size,
    totalSuppliers: database.suppliers.entries.size,
    ingredientsByFunction,
    formulationsByType,
    restrictedIngredients: restrictedCount,
    naturalIngredients: naturalCount
  };
}