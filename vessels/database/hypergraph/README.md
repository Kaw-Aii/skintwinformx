# SKIN-TWIN Hypergraph Forensic Analysis & Neural Network

## Overview

This directory contains the results of comprehensive forensic analysis on the SKIN-TWIN vessel ecosystem, constructing multiple graph representations and mapping them to a HyperGraph Neural Network (RAWSHGNN) architecture.

## Generated Artifacts

### Graph Structures

#### 1. RSGraph (Supply Chain Network)
**File:** `RSGraph.json`

The RSGraph represents the supply chain network with suppliers and ingredients as nodes, connected by supply relationships.

- **Nodes:** 114 (23 suppliers, 91 ingredients)
- **Edges:** 91 supply relationships
- **Density:** 0.0071
- **Structure:** Bipartite graph (Supplier → Ingredient)

**Key Features:**
- Suppliers represented by alphanumeric codes (e.g., NAT0001, MEG0001)
- Ingredients represented by R-series codes (e.g., R1905039)
- Modularity classes identify supplier clusters
- Edge weights represent supply relationship strength

#### 2. RAWGraph (Formulation Network)
**File:** `RAWGraph.json`

The RAWGraph represents the formulation network with products and ingredients as nodes, connected by formulation relationships.

- **Nodes:** 199 (28 products, 171 ingredients)
- **Edges:** 521 formulation relationships
- **Density:** 0.0132
- **Structure:** Weighted bipartite graph (Ingredient → Product)

**Key Features:**
- Products represented by B19-series codes (e.g., B19PRDSPAMRM000)
- Ingredients represented by R-series codes
- Edge weights represent ingredient concentration percentages
- Complex products have 12-29 ingredient connections

#### 3. RAWSHyperGraph (Integrated Network)
**File:** `RAWSHyperGraph.json`

The RAWSHyperGraph integrates both RSGraph and RAWGraph into a unified multi-layer hypergraph structure.

- **Total Nodes:** 231 (unique across both networks)
- **Total Edges:** 612 (combined from both layers)
- **Density:** 0.0115
- **Shared Ingredients:** 82 nodes appear in both layers
- **Integration Strength:** 71.93%

**Key Features:**
- Three-layer architecture: Suppliers → Ingredients → Products
- Cross-layer connections through shared ingredients
- Enables end-to-end supply chain to formulation analysis
- 82 ingredients serve as integration points between layers

### Neural Network Architecture

#### 4. RAWSHGNN (HyperGraph Neural Network)
**File:** `RAWSHGNN.json`

The RAWSHGNN is a multi-layer neural network architecture designed specifically for the hypergraph structure.

**Architecture:**
```
Input Layer (8 features) → 231 nodes
    ↓
Supply Chain Conv (64 units, ReLU) → 203 nodes
    ↓
Formulation Conv (64 units, ReLU) → 208 nodes
    ↓
Attention Fusion (128 units, Tanh) → 180 ingredient nodes
    ↓
Aggregation Layer (64 units, ReLU) → 231 nodes
    ↓
Output Layer (32 units, Softmax) → 231 nodes
```

**Total Parameters:** ~23,040

**Node Features (8-dimensional):**
1. `in_degree` - Number of incoming edges
2. `out_degree` - Number of outgoing edges
3. `betweenness_centrality` - Node importance in network paths
4. `clustering_coefficient` - Local network connectivity
5. `is_supplier` - Binary flag (1 if supplier)
6. `is_ingredient` - Binary flag (1 if ingredient)
7. `is_product` - Binary flag (1 if product)
8. `modularity_class` - Community/cluster assignment

**Adjacency Tensors:**
- `adjacency_supply_chain.csv` - 231×231 supply chain relationships
- `adjacency_formulation.csv` - 231×231 formulation relationships
- `adjacency_cross_layer.csv` - 231×231 cross-layer connections

**Training Configuration:**
- Learning Rate: 0.001
- Epochs: 100
- Batch Size: 32
- Loss Function: Cross-entropy
- Optimizer: Adam

### Analysis Reports

#### 5. Forensic Analysis Report
**File:** `forensic_analysis_report.json`

Comprehensive JSON report containing:
- Graph statistics for RSGraph, RAWGraph, and RAWSHyperGraph
- Centrality measures and critical node identification
- Community structure analysis
- Vulnerability assessments
- Neural network architecture summary
- Strategic recommendations

#### 6. Forensic Analysis Summary
**File:** `FORENSIC_ANALYSIS_SUMMARY.md`

Human-readable markdown summary highlighting:
- Critical nodes (e.g., "De Ion Water" with importance score 25.065)
- Supply chain bottlenecks (6 critical suppliers)
- Integration metrics
- Recommendations for optimization

## Usage

### Loading Graph Data

```typescript
import * as fs from 'fs';

// Load RSGraph
const rsGraph = JSON.parse(
  fs.readFileSync('RSGraph.json', 'utf-8')
);

// Load RAWGraph
const rawGraph = JSON.parse(
  fs.readFileSync('RAWGraph.json', 'utf-8')
);

// Load Integrated HyperGraph
const hyperGraph = JSON.parse(
  fs.readFileSync('RAWSHyperGraph.json', 'utf-8')
);
```

### Loading Neural Network

```typescript
// Load RAWSHGNN architecture
const hgnn = JSON.parse(
  fs.readFileSync('RAWSHGNN.json', 'utf-8')
);

// Access feature matrix
const features = hgnn.feature_matrix.features;
const nodeIds = hgnn.feature_matrix.nodes;

// Access adjacency tensors
const supplyChainAdj = hgnn.adjacency_tensors.supply_chain;
const formulationAdj = hgnn.adjacency_tensors.formulation;
const crossLayerAdj = hgnn.adjacency_tensors.cross_layer;
```

### Analyzing Critical Nodes

```typescript
// Load analysis report
const report = JSON.parse(
  fs.readFileSync('forensic_analysis_report.json', 'utf-8')
);

// Get critical nodes
const criticalNodes = report.insights.critical_nodes;
console.log('Top 5 critical nodes:');
criticalNodes.slice(0, 5).forEach(node => {
  console.log(`${node.label} (${node.type}): ${node.importance}`);
});

// Get bottlenecks
const bottlenecks = report.insights.bottlenecks;
console.log(`Supply chain bottlenecks: ${bottlenecks.length}`);
```

## Key Insights

### Network Topology

1. **Sparse Networks:** Both RSGraph (0.0071) and RAWGraph (0.0132) are sparse, indicating specialized relationships rather than dense connectivity.

2. **Critical Ingredients:** 82 ingredients serve as integration points between supply chain and formulation layers, representing 71.93% integration strength.

3. **Hub Nodes:** "De Ion Water" (R010000) is the most critical node with importance score 25.065, appearing in ~50 products.

### Vulnerability Assessment

1. **Single Point Failures:** 6 critical suppliers identified with high out-degree, representing supply chain risks.

2. **Supplier Concentration:** 
   - NAT0001 (Natchem CC): 16 ingredients
   - MEG0001 (Meganede CC): 15 ingredients
   - Top 4 suppliers control 44% of ingredient supply

3. **Formulation Complexity:**
   - Average product complexity: 18.6 ingredients
   - Most complex: "Scar Repair Forte" (29 ingredients)
   - Simplest: Single-active formulations

### Neural Network Applications

The RAWSHGNN architecture enables:

1. **Predictive Analytics:**
   - Formulation performance prediction
   - Supply chain disruption forecasting
   - Ingredient substitution recommendations

2. **Optimization:**
   - Cost optimization across supply chain
   - Formulation complexity reduction
   - Supply chain diversification strategies

3. **Risk Management:**
   - Critical node monitoring
   - Bottleneck identification
   - Alternative supplier suggestions

## Recommendations

Based on the forensic analysis:

1. **Diversify Supply Chain:** Reduce dependency on 6 critical suppliers by developing alternative sources

2. **Optimize Formulations:** Review products with >25 ingredients for simplification opportunities

3. **Strengthen Integration:** Leverage 82 shared ingredients for supply chain resilience

4. **Implement RAWSHGNN:** Deploy neural network for predictive analytics and real-time optimization

5. **Monitor Critical Nodes:** Establish alerts for nodes with high betweenness centrality (>0.5)

## Regeneration

To regenerate the analysis:

```bash
cd /home/runner/work/skintwinformx/skintwinformx
npx tsx scripts/forensic-hypergraph-analysis.ts
```

This will:
1. Parse vessels/examples CSV files
2. Construct RSGraph and RAWGraph
3. Integrate into RAWSHyperGraph
4. Map to RAWSHGNN architecture
5. Generate all analysis files in this directory

## Technical Specifications

### Data Formats

**Graph JSON Structure:**
```typescript
{
  metadata: {
    name: string;
    description: string;
    node_count: number;
    edge_count: number;
    density: number;
    created_at: string;
  };
  nodes: Array<{
    id: string;
    label: string;
    type: 'supplier' | 'ingredient' | 'product';
    modularity_class?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'Directed';
    id: number;
    weight: number;
  }>;
}
```

**Neural Network JSON Structure:**
```typescript
{
  architecture: {
    name: 'RAWSHGNN';
    type: 'HGNN';
    layers: Array<{
      name: string;
      type: 'input' | 'hidden' | 'output' | 'attention' | 'aggregation';
      dimension: number;
      activation: string;
      nodes: string[];
    }>;
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
```

## Integration with SKIN-TWIN Platform

These graph structures and neural network architecture integrate with:

1. **Vessel System:** Product, Ingredient, Supplier vessels reference graph nodes
2. **Formulation Engine:** Uses RAWGraph for ingredient selection and optimization
3. **Supply Chain Module:** Leverages RSGraph for sourcing and risk assessment
4. **Analytics Dashboard:** Visualizes hypergraph metrics and critical nodes
5. **AI Formulation Assistant:** Uses RAWSHGNN for intelligent recommendations

## Version History

- **v1.0.0** (2025-11-30): Initial forensic analysis implementation
  - RSGraph construction from RSNodes/RSEdges
  - RAWGraph construction from RAW-Nodes/RAW-Edges
  - RAWSHyperGraph integration
  - RAWSHGNN neural network mapping
  - Comprehensive analysis reports

## References

- Source Data: `/vessels/examples/` (RSNodes.csv, RSEdges.csv, RAW-Nodes.csv, RAW-Edges.csv)
- Analysis Script: `/scripts/forensic-hypergraph-analysis.ts`
- Architecture Documentation: `/vessels/examples/ARCHITECTURE.md`
- Network Analysis: `/vessels/examples/NETWORK_ANALYSIS.md`

---

**SKIN-TWIN Forensic Hypergraph Analysis System**
*Advanced Network Intelligence for Cosmetic Formulation*
