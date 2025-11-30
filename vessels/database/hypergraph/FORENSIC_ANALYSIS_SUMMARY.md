# SKIN-TWIN Forensic Hypergraph Analysis Report

**Generated:** 2025-11-30T10:03:38.996Z

## Executive Summary

This report presents a comprehensive forensic analysis of the SKIN-TWIN hypergraph architecture, constructing and analyzing the RSGraph (Supply Chain), RAWGraph (Formulation), and their integration into the RAWSHyperGraph. Additionally, we map this hypergraph to a HyperGraph Neural Network (RAWSHGNN) for advanced analytics. The COSINGHyperGraph provides functional analysis and formulation type estimation.

## Graph Construction

### RSGraph (Supply Chain Network)
- **Nodes:** 114
- **Edges:** 91
- **Density:** 0.0071
- **Description:** Supply Chain Network: Suppliers and Ingredients

### RAWGraph (Formulation Network)
- **Nodes:** 199
- **Edges:** 521
- **Density:** 0.0132
- **Description:** Formulation Network: Products and Ingredients

### RAWSHyperGraph (Integrated Network)
- **Total Nodes:** 231
- **Total Edges:** 612
- **Density:** 0.0115
- **Shared Ingredients:** 82
- **Integration Strength:** 71.93%

## Network Analysis

### Critical Nodes (Top 5)
1. **De Ion Water** (ingredient) - Importance: 25.065
2. **Scar Repair Forte** (product) - Importance: 14.570
3. **Daily Ultra Def SPF25** (product) - Importance: 13.058
4. **Pigment Perfector** (product) - Importance: 12.553
5. **Rejuvoderm Night Maintenance** (product) - Importance: 12.060

### Vulnerability Assessment
- **Single Point Failures:** 6
- **Bottlenecks:** 6 critical suppliers identified

### Community Structure
- **RSGraph Communities:** 23
- **RAWGraph Communities:** 1

## HyperGraph Neural Network (RAWSHGNN)

### Architecture
- **Model Type:** HGNN
- **Total Layers:** 6
- **Total Parameters:** ~23,040

### Layer Configuration
- **input** (input): Dimension 8, Activation: none, Nodes: 231
- **supply_chain_conv** (hidden): Dimension 64, Activation: relu, Nodes: 203
- **formulation_conv** (hidden): Dimension 64, Activation: relu, Nodes: 208
- **attention_fusion** (attention): Dimension 128, Activation: tanh, Nodes: 180
- **aggregation** (aggregation): Dimension 64, Activation: relu, Nodes: 231
- **output** (output): Dimension 32, Activation: softmax, Nodes: 231

### Feature Space
- **Node Features:** 8
- **Feature Names:** in_degree, out_degree, betweenness_centrality, clustering_coefficient, is_supplier, is_ingredient, is_product, modularity_class
- **Total Nodes:** 231

### Adjacency Tensors
- **Supply Chain Matrix:** 231 × 231
- **Formulation Matrix:** 231 × 231
- **Cross-Layer Matrix:** 231 × 231

### Training Configuration
- **Learning Rate:** 0.001
- **Epochs:** 100
- **Batch Size:** 32
- **Loss Function:** cross_entropy
- **Optimizer:** adam


## COSINGHyperGraph Analysis

### Formulation Type Estimation

The COSINGHyperGraph provides a functional analysis of formulations by grouping ingredients based on their COSING-defined functions. This enables estimation of formulation type diversity and complexity.

#### Key Statistics
- **Total Formulation Types:** 6
- **Mapped Ingredients:** 47
- **Unmapped Ingredients:** 133
- **Mapping Coverage:** 26.11%

#### Formulation Type Interpretation

A "formulation type" is defined as a unique combination of ingredient functions. For example:
- Type A: Emollient + Humectant + Preservative
- Type B: Active + Emollient + Emulsifier + Preservative

The system identified **6 distinct formulation types** across the product catalog. This represents the diversity of formulation architectures being used.

#### Top Formulation Patterns
1. **Active, Humectant, Other, Surfactant, Unmapped** - 10 products
2. **Active, Other, Unmapped** - 8 products
3. **Other, Unmapped** - 4 products
4. **Active, Humectant, Other, Unmapped** - 4 products
5. **Active, Emollient, Other, Unmapped** - 1 products

#### Function Distribution
- **Unmapped**: 133 ingredients
- **Other**: 23 ingredients
- **Active**: 12 ingredients
- **Humectant**: 7 ingredients
- **Surfactant**: 3 ingredients
- **Fragrance**: 1 ingredients
- **Emollient**: 1 ingredients

#### Formulation Complexity Insights

The formulation type count (6) represents:
1. **Formulation Diversity**: 6 unique functional architectures
2. **Innovation Potential**: Additional combinations of functions could yield new formulation types
3. **Optimization Opportunities**: Products sharing the same formulation type can be optimized together



## Key Insights & Recommendations

1. Diversify supply chain: 6 critical suppliers identified
2. Optimize formulation complexity: Average 2.6 ingredients per product
3. Strengthen cross-layer integration: 82 shared ingredients provide resilience
4. Implement RAWSHGNN for predictive analytics and optimization
5. Monitor critical nodes with high betweenness centrality for supply chain disruptions

## Network Metrics Summary

| Metric | RSGraph | RAWGraph | RAWSHyperGraph |
|--------|---------|----------|----------------|
| Nodes | 114 | 199 | 231 |
| Edges | 91 | 521 | 612 |
| Density | 0.0071 | 0.0132 | 0.0115 |
| Avg Degree | 0.80 | 2.62 | 2.65 |

## Exported Files

- `RSGraph.json` - Supply Chain Network
- `RAWGraph.json` - Formulation Network
- `RAWSHyperGraph.json` - Integrated Hypergraph
- `RAWSHGNN.json` - Neural Network Architecture
- `adjacency_supply_chain.csv` - Supply Chain Adjacency Matrix
- `adjacency_formulation.csv` - Formulation Adjacency Matrix
- `adjacency_cross_layer.csv` - Cross-Layer Adjacency Matrix
- `forensic_analysis_report.json` - Complete Analysis Report
- `COSINGHyperGraph.json` - Function-Based Formulation Type Analysis

## Conclusion

The forensic analysis reveals a complex, multi-layered hypergraph structure with 231 nodes and 612 edges. The RAWSHGNN architecture provides a foundation for advanced machine learning applications including:

- Formulation optimization
- Supply chain risk prediction
- Ingredient substitution recommendations
- Product performance prediction
- Cost optimization
- Function-based formulation type exploration (6 types identified)

**Status:** ✅ Ready for deployment and training

---
*SKIN-TWIN Forensic Analysis System - 2025*
