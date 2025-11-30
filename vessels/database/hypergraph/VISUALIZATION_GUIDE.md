# SKIN-TWIN Hypergraph Visualization Guide

## Overview

This document provides visual representations and explanations of the SKIN-TWIN hypergraph architecture, including RSGraph, RAWGraph, RAWSHyperGraph, and the RAWSHGNN neural network mapping.

## Graph Structures

### 1. RSGraph - Supply Chain Network

```
┌─────────────────────────────────────────────────────────────┐
│                    RSGraph Architecture                      │
│                                                              │
│  Suppliers (23 nodes)          Ingredients (91 nodes)       │
│                                                              │
│  ┌──────────────┐              ┌─────────────┐             │
│  │ NAT0001      │──────────────▶│ R1905001    │             │
│  │ Natchem CC   │──────────────▶│ R1905037    │             │
│  │ (16 products)│──────────────▶│ R1905045    │             │
│  └──────────────┘              └─────────────┘             │
│                                                              │
│  ┌──────────────┐              ┌─────────────┐             │
│  │ MEG0001      │──────────────▶│ R1905018    │             │
│  │ Meganede CC  │──────────────▶│ R1905027    │             │
│  │ (15 products)│──────────────▶│ R1905035    │             │
│  └──────────────┘              └─────────────┘             │
│                                                              │
│  ┌──────────────┐              ┌─────────────┐             │
│  │ CAR0002      │──────────────▶│ R1905011    │             │
│  │ Carst&Walker │──────────────▶│ R1905012    │             │
│  │ (8 products) │──────────────▶│ R1911001    │             │
│  └──────────────┘              └─────────────┘             │
│                                                              │
│  Network Metrics:                                            │
│  • Nodes: 114 (23 suppliers + 91 ingredients)               │
│  • Edges: 91 (directed supplier → ingredient)               │
│  • Density: 0.0071 (sparse network)                         │
│  • Average Degree: 0.80                                      │
│  • Critical Suppliers: 6 (NAT, MEG, CAR, CJP, CRO, CTE)     │
└─────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- **Bipartite Graph**: Suppliers connect only to ingredients, not to each other
- **Directed Edges**: Information flows from suppliers to ingredients
- **Sparse Structure**: Low density indicates specialized supplier-ingredient relationships
- **Hub Suppliers**: Top suppliers (NAT0001, MEG0001) have high out-degree (15-16 products)

### 2. RAWGraph - Formulation Network

```
┌──────────────────────────────────────────────────────────────────┐
│                     RAWGraph Architecture                         │
│                                                                   │
│  Ingredients (171 nodes)         Products (28 nodes)             │
│                                                                   │
│  ┌────────────────┐              ┌─────────────────────┐        │
│  │ R010000        │──65.60%─────▶│ B19PRDSPAMRM000     │        │
│  │ De Ion Water   │──64.20%─────▶│ B19PRDSPAORM000     │        │
│  │ (Critical)     │──71.15%─────▶│ B19PRDSPAIFL000     │        │
│  │ Used in 50     │──52.99%─────▶│ B19EPGX001          │        │
│  │ products       │──49.70%─────▶│ B19RMS001           │        │
│  └────────────────┘              └─────────────────────┘        │
│                                                                   │
│  ┌────────────────┐              ┌─────────────────────┐        │
│  │ R0102031       │───0.30%─────▶│ B19PRDSPAORM000     │        │
│  │ Xanthan Gum    │───0.35%─────▶│ B19PRDSPAIFL000     │        │
│  │ (Stabilizer)   │───0.20%─────▶│ B19CIPP001          │        │
│  │ Used in 23     │───0.30%─────▶│ B19EPGX001          │        │
│  │ products       │───0.25%─────▶│ B19RBC001           │        │
│  └────────────────┘              └─────────────────────┘        │
│                                                                   │
│  ┌────────────────┐              ┌─────────────────────┐        │
│  │ R1908000       │──200.00%────▶│ B19PLGO001          │        │
│  │ Guaiazulene    │               │ Laser Gel Azu-Repair│        │
│  │ (Pure)         │               │                     │        │
│  └────────────────┘              └─────────────────────┘        │
│                                                                   │
│  Network Metrics:                                                 │
│  • Nodes: 199 (171 ingredients + 28 products)                    │
│  • Edges: 521 (weighted ingredient → product)                    │
│  • Density: 0.0132 (sparse but more connected than RSGraph)      │
│  • Average Degree: 2.62                                           │
│  • Average Product Complexity: 18.6 ingredients/product           │
│  • Most Complex: Scar Repair Forte (29 ingredients)              │
└──────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- **Weighted Edges**: Represent ingredient concentration percentages
- **Hub Ingredients**: De Ion Water (R010000) appears in ~89% of products
- **Concentration Range**: 0.01% (trace) to 200% (pure ingredient)
- **Product Complexity**: Varies from 12 (simple) to 29 (complex) ingredients

### 3. RAWSHyperGraph - Integrated Network

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  RAWSHyperGraph Multi-Layer Architecture                  │
│                                                                           │
│  Layer 1: Supply Chain          Layer 2: Integration      Layer 3: Form  │
│                                                                           │
│  ┌──────────┐                  ┌─────────────┐          ┌─────────────┐ │
│  │Suppliers │                  │ Ingredients │          │  Products   │ │
│  │(23 nodes)│                  │ (180 nodes) │          │ (28 nodes)  │ │
│  └──────────┘                  └─────────────┘          └─────────────┘ │
│       │                               │                        ▲         │
│       │                               │                        │         │
│       │  91 supply edges              │  82 shared             │  521    │
│       │                               │  ingredients           │  edges  │
│       ▼                               ▼                        │         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Integration Zone (82 nodes)                     │ │
│  │                                                                     │ │
│  │  • Cross-layer connectivity                                        │ │
│  │  • Shared ingredients bridge supply chain & formulation           │ │
│  │  • Integration strength: 71.93%                                    │ │
│  │                                                                     │ │
│  │  Example flow:                                                      │ │
│  │  NAT0001 ──▶ R1905001 ──▶ [Integration] ──▶ B1930P002             │ │
│  │  (Supplier)  (Ingredient)  (Cross-layer)     (Product)             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Total Network Metrics:                                                   │
│  • Total Unique Nodes: 231                                                │
│  • Total Edges: 612                                                       │
│  • Network Density: 0.0115                                                │
│  • Cross-Layer Nodes: 82 ingredients (35.5% of total)                    │
│  • Layers: 3 (suppliers → ingredients → products)                        │
│  • End-to-End Paths: Supplier → Ingredient → Product                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Integration Metrics:**
- **Layer Coverage**: 
  - Supply Chain: 49.4% of total nodes
  - Formulation: 86.1% of total nodes
- **Shared Ingredients**: 82 nodes appear in both layers (71.93% of supply chain ingredients)
- **Critical Integration Points**: These 82 ingredients enable end-to-end traceability

## RAWSHGNN Neural Network Architecture

### Layer-by-Layer Visualization

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     RAWSHGNN Architecture (6 Layers)                        │
│                                                                             │
│  INPUT LAYER (231 nodes × 8 features)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Node Features:                                                       │  │
│  │ • in_degree: incoming edge count                                     │  │
│  │ • out_degree: outgoing edge count                                    │  │
│  │ • betweenness_centrality: path importance                           │  │
│  │ • clustering_coefficient: local connectivity                         │  │
│  │ • is_supplier, is_ingredient, is_product: type flags               │  │
│  │ • modularity_class: community assignment                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              ↓                                              │
│  HIDDEN LAYER 1: Supply Chain Convolution (203 nodes × 64 units)          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ • Activation: ReLU                                                   │  │
│  │ • Processes: Suppliers (23) + Ingredients (180)                     │  │
│  │ • Learns: Supply chain relationships and patterns                    │  │
│  │ • Adjacency: Supply chain tensor (231×231)                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              ↓                                              │
│  HIDDEN LAYER 2: Formulation Convolution (208 nodes × 64 units)           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ • Activation: ReLU                                                   │  │
│  │ • Processes: Ingredients (180) + Products (28)                      │  │
│  │ • Learns: Formulation relationships and concentration patterns       │  │
│  │ • Adjacency: Formulation tensor (231×231)                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              ↓                                              │
│  ATTENTION LAYER: Cross-Layer Fusion (180 ingredient nodes × 128 units)   │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ • Activation: Tanh                                                   │  │
│  │ • Processes: Shared ingredients only (cross-layer nodes)            │  │
│  │ • Learns: Attention weights for layer integration                   │  │
│  │ • Adjacency: Cross-layer tensor (231×231)                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              ↓                                              │
│  AGGREGATION LAYER (231 nodes × 64 units)                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ • Activation: ReLU                                                   │  │
│  │ • Processes: All nodes (full network)                               │  │
│  │ • Learns: Global network patterns and node importance               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              ↓                                              │
│  OUTPUT LAYER (231 nodes × 32 units)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ • Activation: Softmax                                                │  │
│  │ • Outputs: Node embeddings for downstream tasks                     │  │
│  │ • Applications: Classification, prediction, recommendation          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Total Parameters: ~23,040                                                  │
│  Training: Adam optimizer, learning_rate=0.001, epochs=100                 │
│  Loss: Cross-entropy for multi-class classification                        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Information Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│              RAWSHGNN Information Flow                            │
│                                                                   │
│  Raw Node Features (8D)                                           │
│         ↓                                                         │
│  ┌──────────────────────────────┐                                │
│  │  Input Embedding              │                                │
│  │  231 nodes × 8 features       │                                │
│  └──────────────────────────────┘                                │
│         ↓                                                         │
│  ┌──────────────────────────────┐                                │
│  │  Graph Convolution Layer 1    │  ← Supply Chain Adjacency     │
│  │  Supply chain patterns        │                                │
│  │  64-dim embeddings            │                                │
│  └──────────────────────────────┘                                │
│         ↓                                                         │
│  ┌──────────────────────────────┐                                │
│  │  Graph Convolution Layer 2    │  ← Formulation Adjacency      │
│  │  Formulation patterns         │                                │
│  │  64-dim embeddings            │                                │
│  └──────────────────────────────┘                                │
│         ↓                                                         │
│  ┌──────────────────────────────┐                                │
│  │  Attention Mechanism          │  ← Cross-Layer Adjacency      │
│  │  Layer fusion & weighting     │                                │
│  │  128-dim attended features    │                                │
│  └──────────────────────────────┘                                │
│         ↓                                                         │
│  ┌──────────────────────────────┐                                │
│  │  Global Aggregation           │                                │
│  │  Network-wide patterns        │                                │
│  │  64-dim unified embeddings    │                                │
│  └──────────────────────────────┘                                │
│         ↓                                                         │
│  ┌──────────────────────────────┐                                │
│  │  Final Projection             │                                │
│  │  Task-specific outputs        │                                │
│  │  32-dim output embeddings     │                                │
│  └──────────────────────────────┘                                │
│         ↓                                                         │
│  Predictions / Recommendations                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Critical Nodes Visualization

### Top 10 Most Important Nodes

```
Importance Score Scale: 0 ─────────────────────── 25

1. R010000 (De Ion Water)                     ████████████████████████ 25.07
   Type: Ingredient | In 50 products

2. B19RSR005 (Scar Repair Forte)              ██████████████ 14.57
   Type: Product | 29 ingredients

3. B19RDS001 (Daily Ultra Def SPF25)          █████████████ 13.06
   Type: Product | 26 ingredients

4. B19CIPP001 (Pigment Perfector)             ████████████ 12.55
   Type: Product | 25 ingredients

5. B19PRODZNERN000 (Rejuvoderm Night)         ████████████ 12.06
   Type: Product | 24 ingredients

6. NAT0001 (Natchem CC)                       ████████ 8.07
   Type: Supplier | 16 ingredients

7. MEG0001 (Meganede CC)                      ███████ 7.57
   Type: Supplier | 15 ingredients

8. B19NBO003 (Omega Night Complex)            ███████ 7.05
   Type: Product | 24 ingredients

9. R0102031 (Xanthan Gum)                     ██████ 6.53
   Type: Ingredient | In 23 products

10. B19QUEL002 (Quantum Elastin)              ██████ 6.05
    Type: Product | 22 ingredients
```

### Supply Chain Bottlenecks

```
Critical Supplier Dependencies (High Risk):

┌────────────┬──────────────────┬──────────────┬────────────┐
│ Supplier   │ Ingredients      │ Out-Degree   │ Risk Level │
├────────────┼──────────────────┼──────────────┼────────────┤
│ NAT0001    │ Natchem CC       │     16       │    ████    │
│ MEG0001    │ Meganede CC      │     15       │    ████    │
│ CAR0002    │ Carst&Walker     │      8       │    ███     │
│ CJP0001    │ CJP Chemicals    │      8       │    ███     │
│ CRO0001    │ Croda Chemicals  │      7       │    ███     │
│ CTE0001    │ Chemgrit         │      6       │    ██      │
└────────────┴──────────────────┴──────────────┴────────────┘

Recommendation: Develop alternative suppliers for top 3 bottlenecks
```

## Use Case Applications

### 1. Formulation Optimization

```
Input: Product requirements + Constraints
  ↓
RAWSHGNN processes:
  → Analyzes ingredient compatibility (RAWGraph)
  → Checks supplier availability (RSGraph)
  → Considers concentration ranges
  ↓
Output: Optimized formulation + Cost estimate
```

### 2. Supply Chain Risk Prediction

```
Input: Supplier disruption event
  ↓
RAWSHGNN analyzes:
  → Affected ingredients (direct impact)
  → Impacted products (downstream effect)
  → Alternative suppliers (mitigation options)
  ↓
Output: Risk assessment + Contingency plan
```

### 3. Ingredient Substitution

```
Input: Ingredient to replace + Constraints
  ↓
RAWSHGNN finds:
  → Similar ingredients (feature similarity)
  → Compatible suppliers (RSGraph)
  → Products using both (validation)
  ↓
Output: Ranked substitution candidates
```

## Data Files Reference

| File | Size | Description |
|------|------|-------------|
| `RSGraph.json` | 32 KB | Supply chain network |
| `RAWGraph.json` | 113 KB | Formulation network |
| `RAWSHyperGraph.json` | 135 KB | Integrated hypergraph |
| `RAWSHGNN.json` | 1.8 MB | Neural network architecture + data |
| `adjacency_supply_chain.csv` | 105 KB | Supply chain adjacency matrix |
| `adjacency_formulation.csv` | 105 KB | Formulation adjacency matrix |
| `adjacency_cross_layer.csv` | 105 KB | Cross-layer adjacency matrix |
| `forensic_analysis_report.json` | 27 KB | Complete analysis report |

## Visualization Tools

### Recommended Libraries

**Python:**
```python
import networkx as nx
import matplotlib.pyplot as plt
import json

# Load graph
with open('RSGraph.json', 'r') as f:
    data = json.load(f)

# Create NetworkX graph
G = nx.DiGraph()
for node in data['nodes']:
    G.add_node(node['id'], **node)
for edge in data['edges']:
    G.add_edge(edge['source'], edge['target'], weight=edge['weight'])

# Visualize
pos = nx.spring_layout(G)
nx.draw(G, pos, with_labels=True, node_color='lightblue')
plt.show()
```

**JavaScript (D3.js):**
```javascript
import * as d3 from 'd3';

d3.json('RSGraph.json').then(data => {
  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.edges).id(d => d.id))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width/2, height/2));
  
  // Add visualization logic
});
```

## Summary

The SKIN-TWIN hypergraph architecture provides:

✅ **Complete Supply Chain Mapping**: 23 suppliers → 91 ingredients  
✅ **Comprehensive Formulation Network**: 171 ingredients → 28 products  
✅ **Integrated Multi-Layer View**: 231 nodes, 612 edges, 71.93% integration  
✅ **Advanced Neural Network**: 6-layer HGNN with 23K parameters  
✅ **Critical Node Identification**: 10 key nodes, 6 bottlenecks  
✅ **Production-Ready**: Trained config, adjacency tensors, feature matrices  

**Status**: ✅ Ready for deployment and integration with SKIN-TWIN platform

---
*SKIN-TWIN Hypergraph Visualization System - 2025*
