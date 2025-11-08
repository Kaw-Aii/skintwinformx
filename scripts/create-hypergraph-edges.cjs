#!/usr/bin/env node
/**
 * Hypergraph Edge Generator
 * Creates edge relationships between product, formulation, and PIF vessels
 * Integrates with the SKIN-TWIN hypergraph database
 * 
 * Usage: node scripts/create-hypergraph-edges.cjs
 */

const fs = require('fs');
const path = require('path');

class HypergraphEdgeGenerator {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.vesselsDir = path.join(rootDir, 'vessels');
    this.edgesDir = path.join(this.vesselsDir, 'edges');
    this.databaseDir = path.join(this.vesselsDir, 'database');
    
    this.products = [];
    this.formulations = [];
    this.pifs = [];
    this.edges = [];
  }

  /**
   * Main execution
   */
  async run() {
    console.log('🔗 Hypergraph Edge Generator');
    console.log('='.repeat(70));
    console.log();

    // Ensure edges directory exists
    if (!fs.existsSync(this.edgesDir)) {
      fs.mkdirSync(this.edgesDir, { recursive: true });
    }

    // Load all vessels
    await this.loadVessels();

    // Generate edges
    this.generateProductToFormulationEdges();
    this.generateProductToPIFEdges();
    this.generateFormulationToPIFEdges();

    // Save edges
    this.saveEdges();

    // Update database relationships
    this.updateDatabaseRelationships();

    // Generate report
    this.generateReport();
  }

  /**
   * Load all vessel files
   */
  async loadVessels() {
    console.log('📂 Loading vessels...');

    // Load products
    const productsDir = path.join(this.vesselsDir, 'products');
    const productFiles = fs.readdirSync(productsDir)
      .filter(f => f.startsWith('B19PRD') && f.endsWith('.json'));
    
    for (const file of productFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(productsDir, file), 'utf-8'));
      this.products.push(data);
    }
    console.log(`   ✓ Loaded ${this.products.length} products`);

    // Load formulations
    const formulationsDir = path.join(this.vesselsDir, 'formulations');
    const formulationFiles = fs.readdirSync(formulationsDir)
      .filter(f => f.startsWith('B19FRM') && f.endsWith('.json'));
    
    for (const file of formulationFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(formulationsDir, file), 'utf-8'));
      this.formulations.push(data);
    }
    console.log(`   ✓ Loaded ${this.formulations.length} formulations`);

    // Load PIFs
    const pifsDir = path.join(this.vesselsDir, 'msdspif', 'processed');
    const pifFiles = fs.readdirSync(pifsDir)
      .filter(f => f.startsWith('B19PIF') && f.endsWith('.json'));
    
    for (const file of pifFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(pifsDir, file), 'utf-8'));
      this.pifs.push(data);
    }
    console.log(`   ✓ Loaded ${this.pifs.length} PIFs`);
    console.log();
  }

  /**
   * Generate product to formulation edges
   */
  generateProductToFormulationEdges() {
    console.log('🔗 Generating Product → Formulation edges...');
    
    for (const product of this.products) {
      const formulation = this.formulations.find(f => 
        f.product_reference === product.id || 
        f.id === product.id.replace('B19PRD', 'B19FRM')
      );

      if (formulation) {
        const edge = {
          id: `B19EDG_${product.id}_${formulation.id}`,
          type: 'PRODUCT_HAS_FORMULATION',
          source_id: product.id,
          source_type: 'product',
          target_id: formulation.id,
          target_type: 'formulation',
          properties: {
            ingredient_count: formulation.ingredients?.length || 0,
            total_concentration: formulation.total_concentration || 0,
            created_at: new Date().toISOString()
          }
        };

        this.edges.push(edge);
      }
    }

    console.log(`   ✓ Generated ${this.edges.length} Product → Formulation edges`);
  }

  /**
   * Generate product to PIF edges
   */
  generateProductToPIFEdges() {
    console.log('🔗 Generating Product → PIF edges...');
    
    const startEdges = this.edges.length;

    for (const product of this.products) {
      const pif = this.pifs.find(p => 
        p.product_reference === product.id ||
        p.id === product.id.replace('B19PRD', 'B19PIF')
      );

      if (pif) {
        const edge = {
          id: `B19EDG_${product.id}_${pif.id}`,
          type: 'PRODUCT_HAS_PIF',
          source_id: product.id,
          source_type: 'product',
          target_id: pif.id,
          target_type: 'pif',
          properties: {
            document_source: pif.document_metadata?.filename || 'unknown',
            extraction_date: pif.document_metadata?.extraction_date || new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        };

        this.edges.push(edge);
      }
    }

    const newEdges = this.edges.length - startEdges;
    console.log(`   ✓ Generated ${newEdges} Product → PIF edges`);
  }

  /**
   * Generate formulation to PIF edges
   */
  generateFormulationToPIFEdges() {
    console.log('🔗 Generating Formulation → PIF edges...');
    
    const startEdges = this.edges.length;

    for (const formulation of this.formulations) {
      const pif = this.pifs.find(p => 
        p.formulation_reference === formulation.id ||
        p.id === formulation.id.replace('B19FRM', 'B19PIF')
      );

      if (pif) {
        const edge = {
          id: `B19EDG_${formulation.id}_${pif.id}`,
          type: 'FORMULATION_DOCUMENTED_IN_PIF',
          source_id: formulation.id,
          source_type: 'formulation',
          target_id: pif.id,
          target_type: 'pif',
          properties: {
            document_source: pif.document_metadata?.filename || 'unknown',
            created_at: new Date().toISOString()
          }
        };

        this.edges.push(edge);
      }
    }

    const newEdges = this.edges.length - startEdges;
    console.log(`   ✓ Generated ${newEdges} Formulation → PIF edges`);
  }

  /**
   * Save edges to files
   */
  saveEdges() {
    console.log('\n💾 Saving edges...');

    // Save individual edge files
    for (const edge of this.edges) {
      const edgePath = path.join(this.edgesDir, `${edge.id}.json`);
      fs.writeFileSync(edgePath, JSON.stringify(edge, null, 2));
    }

    console.log(`   ✓ Saved ${this.edges.length} edge files to ${this.edgesDir}`);

    // Save consolidated edges file
    const consolidatedPath = path.join(this.edgesDir, 'all_edges.json');
    fs.writeFileSync(consolidatedPath, JSON.stringify(this.edges, null, 2));
    console.log(`   ✓ Saved consolidated edges to all_edges.json`);
  }

  /**
   * Update database relationships
   */
  updateDatabaseRelationships() {
    console.log('\n📊 Updating database relationships...');

    const relationshipsPath = path.join(this.databaseDir, 'vessel_relationships.json');
    
    const relationships = {
      generated: new Date().toISOString(),
      summary: {
        total_edges: this.edges.length,
        edge_types: {
          product_to_formulation: this.edges.filter(e => e.type === 'PRODUCT_HAS_FORMULATION').length,
          product_to_pif: this.edges.filter(e => e.type === 'PRODUCT_HAS_PIF').length,
          formulation_to_pif: this.edges.filter(e => e.type === 'FORMULATION_DOCUMENTED_IN_PIF').length
        },
        total_products: this.products.length,
        total_formulations: this.formulations.length,
        total_pifs: this.pifs.length
      },
      edges: this.edges,
      products: this.products.map(p => ({
        id: p.id,
        label: p.label,
        type: p.type,
        category: p.category
      })),
      formulations: this.formulations.map(f => ({
        id: f.id,
        product_reference: f.product_reference,
        ingredient_count: f.ingredients?.length || 0
      })),
      pifs: this.pifs.map(p => ({
        id: p.id,
        product_reference: p.product_reference,
        formulation_reference: p.formulation_reference
      }))
    };

    fs.writeFileSync(relationshipsPath, JSON.stringify(relationships, null, 2));
    console.log(`   ✓ Updated vessel_relationships.json`);
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 Hypergraph Integration Report');
    console.log('='.repeat(70));

    console.log(`\n📦 Vessels Loaded:`);
    console.log(`   Products: ${this.products.length}`);
    console.log(`   Formulations: ${this.formulations.length}`);
    console.log(`   PIFs: ${this.pifs.length}`);

    console.log(`\n🔗 Edges Generated:`);
    console.log(`   Product → Formulation: ${this.edges.filter(e => e.type === 'PRODUCT_HAS_FORMULATION').length}`);
    console.log(`   Product → PIF: ${this.edges.filter(e => e.type === 'PRODUCT_HAS_PIF').length}`);
    console.log(`   Formulation → PIF: ${this.edges.filter(e => e.type === 'FORMULATION_DOCUMENTED_IN_PIF').length}`);
    console.log(`   Total: ${this.edges.length}`);

    console.log(`\n📁 Output Locations:`);
    console.log(`   Edge files: ${this.edgesDir}/`);
    console.log(`   Relationships DB: ${this.databaseDir}/vessel_relationships.json`);

    console.log('\n✅ Hypergraph integration complete!');
    console.log('='.repeat(70));
  }
}

// Main execution
async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const generator = new HypergraphEdgeGenerator(rootDir);
  await generator.run();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { HypergraphEdgeGenerator };
