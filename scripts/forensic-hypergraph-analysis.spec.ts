import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Forensic Hypergraph Analysis', () => {
  const outputDir = path.join(process.cwd(), 'vessels', 'database', 'hypergraph');
  
  describe('Graph Files', () => {
    it('should generate RSGraph.json', () => {
      const filepath = path.join(outputDir, 'RSGraph.json');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(data.metadata).toBeDefined();
      expect(data.metadata.name).toBe('RSGraph');
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
      expect(data.nodes.length).toBeGreaterThan(0);
    });
    
    it('should generate RAWGraph.json', () => {
      const filepath = path.join(outputDir, 'RAWGraph.json');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(data.metadata).toBeDefined();
      expect(data.metadata.name).toBe('RAWGraph');
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
      expect(data.nodes.length).toBeGreaterThan(0);
    });
    
    it('should generate RAWSHyperGraph.json', () => {
      const filepath = path.join(outputDir, 'RAWSHyperGraph.json');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(data.metadata).toBeDefined();
      expect(data.metadata.name).toBe('RAWSHyperGraph');
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
      expect(data.layers).toBeDefined();
      expect(data.layers.supply_chain).toBeDefined();
      expect(data.layers.formulation).toBeDefined();
    });
  });
  
  describe('RSGraph Structure', () => {
    it('should have correct node types', () => {
      const filepath = path.join(outputDir, 'RSGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      const suppliers = data.nodes.filter((n: any) => n.type === 'supplier');
      const ingredients = data.nodes.filter((n: any) => n.type === 'ingredient');
      
      expect(suppliers.length).toBeGreaterThan(0);
      expect(ingredients.length).toBeGreaterThan(0);
      expect(suppliers.length + ingredients.length).toBe(data.nodes.length);
    });
    
    it('should have directed edges from suppliers to ingredients', () => {
      const filepath = path.join(outputDir, 'RSGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.edges.length).toBeGreaterThan(0);
      data.edges.forEach((edge: any) => {
        expect(edge.type).toBe('Directed');
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(edge.weight).toBeDefined();
      });
    });
  });
  
  describe('RAWGraph Structure', () => {
    it('should have products and ingredients', () => {
      const filepath = path.join(outputDir, 'RAWGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      const products = data.nodes.filter((n: any) => n.type === 'product');
      const ingredients = data.nodes.filter((n: any) => n.type === 'ingredient');
      
      expect(products.length).toBeGreaterThan(0);
      expect(ingredients.length).toBeGreaterThan(0);
    });
    
    it('should have weighted formulation edges', () => {
      const filepath = path.join(outputDir, 'RAWGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.edges.length).toBeGreaterThan(0);
      data.edges.forEach((edge: any) => {
        expect(edge.weight).toBeGreaterThanOrEqual(0);
      });
    });
  });
  
  describe('RAWSHyperGraph Integration', () => {
    it('should integrate both networks', () => {
      const rsPath = path.join(outputDir, 'RSGraph.json');
      const rawPath = path.join(outputDir, 'RAWGraph.json');
      const hyperPath = path.join(outputDir, 'RAWSHyperGraph.json');
      
      const rsGraph = JSON.parse(fs.readFileSync(rsPath, 'utf-8'));
      const rawGraph = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
      const hyperGraph = JSON.parse(fs.readFileSync(hyperPath, 'utf-8'));
      
      // Hypergraph should have at least as many nodes as the largest graph
      expect(hyperGraph.nodes.length).toBeGreaterThanOrEqual(
        Math.max(rsGraph.nodes.length, rawGraph.nodes.length)
      );
      
      // Should have combined edges
      expect(hyperGraph.edges.length).toBeGreaterThanOrEqual(
        rsGraph.edges.length + rawGraph.edges.length
      );
    });
    
    it('should maintain layer information', () => {
      const filepath = path.join(outputDir, 'RAWSHyperGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.layers.supply_chain).toBeDefined();
      expect(data.layers.formulation).toBeDefined();
      expect(data.layers.supply_chain.node_count).toBeGreaterThan(0);
      expect(data.layers.formulation.node_count).toBeGreaterThan(0);
    });
  });
  
  describe('RAWSHGNN Neural Network', () => {
    it('should generate neural network architecture', () => {
      const filepath = path.join(outputDir, 'RAWSHGNN.json');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(data.architecture).toBeDefined();
      expect(data.architecture.name).toBe('RAWSHGNN');
      expect(data.architecture.type).toBe('HGNN');
      expect(data.architecture.layers).toBeDefined();
      expect(data.architecture.layers.length).toBeGreaterThan(0);
    });
    
    it('should have input, hidden, and output layers', () => {
      const filepath = path.join(outputDir, 'RAWSHGNN.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      const inputLayers = data.architecture.layers.filter((l: any) => l.type === 'input');
      const hiddenLayers = data.architecture.layers.filter((l: any) => l.type === 'hidden');
      const outputLayers = data.architecture.layers.filter((l: any) => l.type === 'output');
      
      expect(inputLayers.length).toBeGreaterThan(0);
      expect(hiddenLayers.length).toBeGreaterThan(0);
      expect(outputLayers.length).toBeGreaterThan(0);
    });
    
    it('should have feature matrix', () => {
      const filepath = path.join(outputDir, 'RAWSHGNN.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.feature_matrix).toBeDefined();
      expect(data.feature_matrix.nodes).toBeDefined();
      expect(data.feature_matrix.features).toBeDefined();
      expect(data.feature_matrix.feature_names).toBeDefined();
      
      // Feature matrix should match node count
      expect(data.feature_matrix.nodes.length).toBe(data.feature_matrix.features.length);
    });
    
    it('should have adjacency tensors', () => {
      const filepath = path.join(outputDir, 'RAWSHGNN.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.adjacency_tensors).toBeDefined();
      expect(data.adjacency_tensors.supply_chain).toBeDefined();
      expect(data.adjacency_tensors.formulation).toBeDefined();
      expect(data.adjacency_tensors.cross_layer).toBeDefined();
      
      // All tensors should be same size (square matrices)
      const size = data.feature_matrix.nodes.length;
      expect(data.adjacency_tensors.supply_chain.length).toBe(size);
      expect(data.adjacency_tensors.formulation.length).toBe(size);
      expect(data.adjacency_tensors.cross_layer.length).toBe(size);
    });
    
    it('should have training configuration', () => {
      const filepath = path.join(outputDir, 'RAWSHGNN.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.training_config).toBeDefined();
      expect(data.training_config.learning_rate).toBeGreaterThan(0);
      expect(data.training_config.epochs).toBeGreaterThan(0);
      expect(data.training_config.batch_size).toBeGreaterThan(0);
      expect(data.training_config.loss_function).toBeDefined();
      expect(data.training_config.optimizer).toBeDefined();
    });
  });
  
  describe('Forensic Analysis Report', () => {
    it('should generate comprehensive report', () => {
      const filepath = path.join(outputDir, 'forensic_analysis_report.json');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(data.timestamp).toBeDefined();
      expect(data.graphs).toBeDefined();
      expect(data.neural_network).toBeDefined();
      expect(data.insights).toBeDefined();
    });
    
    it('should identify critical nodes', () => {
      const filepath = path.join(outputDir, 'forensic_analysis_report.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.insights.critical_nodes).toBeDefined();
      expect(Array.isArray(data.insights.critical_nodes)).toBe(true);
      expect(data.insights.critical_nodes.length).toBeGreaterThan(0);
    });
    
    it('should detect bottlenecks', () => {
      const filepath = path.join(outputDir, 'forensic_analysis_report.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.insights.bottlenecks).toBeDefined();
      expect(Array.isArray(data.insights.bottlenecks)).toBe(true);
    });
    
    it('should provide recommendations', () => {
      const filepath = path.join(outputDir, 'forensic_analysis_report.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.insights.recommendations).toBeDefined();
      expect(Array.isArray(data.insights.recommendations)).toBe(true);
      expect(data.insights.recommendations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Adjacency Matrix CSV Files', () => {
    it('should generate supply chain adjacency matrix', () => {
      const filepath = path.join(outputDir, 'adjacency_supply_chain.csv');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
    
    it('should generate formulation adjacency matrix', () => {
      const filepath = path.join(outputDir, 'adjacency_formulation.csv');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
    
    it('should generate cross-layer adjacency matrix', () => {
      const filepath = path.join(outputDir, 'adjacency_cross_layer.csv');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });
  
  describe('Summary Documentation', () => {
    it('should generate markdown summary', () => {
      const filepath = path.join(outputDir, 'FORENSIC_ANALYSIS_SUMMARY.md');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('# SKIN-TWIN Forensic Hypergraph Analysis Report');
      expect(content).toContain('RSGraph');
      expect(content).toContain('RAWGraph');
      expect(content).toContain('RAWSHyperGraph');
      expect(content).toContain('RAWSHGNN');
    });
    
    it('should generate README', () => {
      const filepath = path.join(outputDir, 'README.md');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('SKIN-TWIN Hypergraph Forensic Analysis');
    });
  });

  describe('COSINGHyperGraph', () => {
    it('should generate COSINGHyperGraph.json', () => {
      const filepath = path.join(outputDir, 'COSINGHyperGraph.json');
      expect(fs.existsSync(filepath)).toBe(true);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(data.metadata).toBeDefined();
      expect(data.function_groups).toBeDefined();
      expect(data.formulation_types).toBeDefined();
      expect(data.cosing_metadata).toBeDefined();
    });
    
    it('should have formulation type statistics', () => {
      const filepath = path.join(outputDir, 'COSINGHyperGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.formulation_types.total_combinations).toBeGreaterThan(0);
      expect(data.formulation_types.function_distribution).toBeDefined();
      expect(data.formulation_types.formulation_patterns).toBeDefined();
      expect(Array.isArray(data.formulation_types.formulation_patterns)).toBe(true);
    });
    
    it('should have function groups', () => {
      const filepath = path.join(outputDir, 'COSINGHyperGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(Array.isArray(data.function_groups)).toBe(true);
      expect(data.function_groups.length).toBeGreaterThan(0);
      
      // Each function group should have function and ingredients
      data.function_groups.forEach((group: any) => {
        expect(group.function).toBeDefined();
        expect(Array.isArray(group.ingredients)).toBe(true);
      });
    });
    
    it('should have COSING metadata', () => {
      const filepath = path.join(outputDir, 'COSINGHyperGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      expect(data.cosing_metadata.total_cosing_ingredients).toBeGreaterThan(0);
      expect(data.cosing_metadata.mapped_ingredients).toBeGreaterThanOrEqual(0);
      expect(data.cosing_metadata.unmapped_ingredients).toBeGreaterThanOrEqual(0);
      expect(data.cosing_metadata.function_coverage).toBeDefined();
    });
    
    it('should have formulation patterns sorted by frequency', () => {
      const filepath = path.join(outputDir, 'COSINGHyperGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      const patterns = data.formulation_types.formulation_patterns;
      expect(patterns.length).toBeGreaterThan(0);
      
      // Patterns should be sorted by count (descending)
      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i - 1].count).toBeGreaterThanOrEqual(patterns[i].count);
      }
      
      // Each pattern should have functions, count, and example_ingredients
      patterns.forEach((pattern: any) => {
        expect(Array.isArray(pattern.functions)).toBe(true);
        expect(pattern.count).toBeGreaterThan(0);
        expect(Array.isArray(pattern.example_ingredients)).toBe(true);
      });
    });
    
    it('should map ingredients to COSING functions', () => {
      const filepath = path.join(outputDir, 'COSINGHyperGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      const totalMapped = data.cosing_metadata.mapped_ingredients;
      const totalUnmapped = data.cosing_metadata.unmapped_ingredients;
      const totalIngredients = totalMapped + totalUnmapped;
      
      // Should have attempted to map all ingredients
      expect(totalIngredients).toBeGreaterThan(0);
      
      // Mapping coverage should be a valid percentage
      const coverage = (totalMapped / totalIngredients) * 100;
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
    });
    
    it('should calculate total formulation combinations', () => {
      const filepath = path.join(outputDir, 'COSINGHyperGraph.json');
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      const totalCombinations = data.formulation_types.total_combinations;
      const patternsLength = data.formulation_types.formulation_patterns.length;
      
      // Total combinations should match the number of unique patterns
      expect(totalCombinations).toBe(patternsLength);
      expect(totalCombinations).toBeGreaterThan(0);
    });
    
    it('should include COSING section in summary markdown', () => {
      const filepath = path.join(outputDir, 'FORENSIC_ANALYSIS_SUMMARY.md');
      const content = fs.readFileSync(filepath, 'utf-8');
      
      expect(content).toContain('COSINGHyperGraph Analysis');
      expect(content).toContain('Formulation Type Estimation');
      expect(content).toContain('Total Formulation Types');
      expect(content).toContain('Function Distribution');
      expect(content).toContain('Formulation Patterns');
    });
  });
});
