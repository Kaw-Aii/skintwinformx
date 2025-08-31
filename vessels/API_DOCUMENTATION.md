# SKIN-TWIN API Technical Documentation

## Overview

This document provides comprehensive API documentation for interacting with the SKIN-TWIN hypergraph system, including endpoints for schema validation, network analysis, and data management operations.

## API Architecture

### Core API Structure

```mermaid
flowchart TD
    subgraph "Client Layer"
        A[Web Interface]
        B[Mobile App] 
        C[Third-party Integration]
    end
    
    subgraph "API Gateway"
        D[Authentication]
        E[Rate Limiting]
        F[Request Validation]
        G[Response Formatting]
    end
    
    subgraph "Service Layer"
        H[Schema Service]
        I[Hypergraph Service]
        J[Analysis Service]
        K[Validation Service]
    end
    
    subgraph "Data Layer"
        L[Graph Database]
        M[File Storage]
        N[Cache Layer]
        O[Search Index]
    end
    
    A --> D
    B --> D
    C --> D
    D --> H
    E --> I
    F --> J
    G --> K
    H --> L
    I --> M
    J --> N
    K --> O
    
    style D fill:#e3f2fd
    style H fill:#f3e5f5
    style L fill:#e8f5e8
```

## Schema Management API

### Product Schema Operations

#### Create Product
```typescript
POST /api/v1/products
Content-Type: application/json

interface CreateProductRequest {
  id: string;                    // Pattern: B19[A-Z0-9]+
  label: string;
  category: string;
  target_skin_type: string[];
  formulation_phases: object;
  benefits: string[];
  shelf_life: string;
  safety_assessment: object;
  clinical_results?: object;
  cost_analysis?: object;
}

interface CreateProductResponse {
  success: boolean;
  product_id: string;
  validation_report: ValidationReport;
  network_impact: NetworkImpact;
}
```

#### Get Product Details
```typescript
GET /api/v1/products/{productId}

interface GetProductResponse {
  product: Product;
  formulation_edges: FormulationEdge[];
  ingredient_details: Ingredient[];
  network_metrics: {
    centrality_score: number;
    clustering_coefficient: number;
    connected_components: number;
  };
}
```

#### Update Product
```typescript
PUT /api/v1/products/{productId}
Content-Type: application/json

interface UpdateProductRequest {
  // Partial product data
  [key: string]: any;
}

interface UpdateProductResponse {
  success: boolean;
  updated_fields: string[];
  validation_report: ValidationReport;
  network_recalculation: boolean;
}
```

### Ingredient Schema Operations

#### Create Ingredient
```typescript
POST /api/v1/ingredients
Content-Type: application/json

interface CreateIngredientRequest {
  id: string;                    // Pattern: R[0-9]{6}
  label: string;
  inci_name: string;
  category: string;
  molecular_weight?: string;
  concentration_range: {
    min: number;
    max: number;
    optimal?: number;
    unit: string;
  };
  ph_range: {
    min: number;
    max: number;
    optimal?: number;
  };
  solubility: string;
  functions: string[];
  compatibility: {
    excellent?: string[];
    good?: string[];
    avoid?: string[];
    requires_care?: string[];
    notes?: string;
  };
  safety_rating: string;
  pricing_zar?: number;
  supplier_info?: object;
}
```

#### Ingredient Network Analysis
```typescript
GET /api/v1/ingredients/{ingredientId}/network

interface IngredientNetworkResponse {
  ingredient: Ingredient;
  connected_products: Product[];
  supply_chain: Supplier[];
  network_position: {
    betweenness_centrality: number;
    closeness_centrality: number;
    degree_centrality: number;
    clustering_coefficient: number;
  };
  usage_statistics: {
    total_formulations: number;
    average_concentration: number;
    frequency_rank: number;
  };
}
```

### Formulation Operations

#### Create Formulation Edge
```typescript
POST /api/v1/formulations
Content-Type: application/json

interface CreateFormulationRequest {
  source_id: string;             // Ingredient ID
  target_id: string;             // Product ID
  concentration: number;
  phase: string;
  stability_impact?: number;
  manufacturing_notes?: object;
}

interface CreateFormulationResponse {
  success: boolean;
  edge_id: number;
  validation_status: ValidationStatus;
  concentration_check: {
    within_range: boolean;
    ingredient_limits: [number, number];
    product_total: number;
  };
}
```

#### Batch Formulation Validation
```typescript
POST /api/v1/formulations/validate-batch
Content-Type: application/json

interface BatchValidationRequest {
  formulations: FormulationEdge[];
  validation_rules: {
    check_concentration_limits: boolean;
    check_compatibility: boolean;
    check_stability: boolean;
    check_supply_availability: boolean;
  };
}

interface BatchValidationResponse {
  overall_status: "VALID" | "INVALID" | "WARNING";
  individual_results: ValidationResult[];
  summary: {
    total_formulations: number;
    valid_count: number;
    invalid_count: number;
    warning_count: number;
  };
  recommendations: string[];
}
```

## Hypergraph Analysis API

### Network Metrics

#### Calculate Centrality Metrics
```typescript
GET /api/v1/network/centrality?type={type}&entity={entity}

interface CentralityResponse {
  metrics: {
    betweenness_centrality: Record<string, number>;
    closeness_centrality: Record<string, number>;
    degree_centrality: Record<string, number>;
    eigenvector_centrality: Record<string, number>;
  };
  top_nodes: {
    most_central: NodeRanking[];
    most_connected: NodeRanking[];
    most_influential: NodeRanking[];
  };
  visualization_data: GraphVisualization;
}
```

#### Community Detection
```typescript
GET /api/v1/network/communities?algorithm={algorithm}&resolution={resolution}

interface CommunityResponse {
  communities: Community[];
  modularity_score: number;
  algorithm_used: string;
  community_metrics: {
    total_communities: number;
    average_size: number;
    largest_community_size: number;
    modularity_density: number;
  };
  visualization_data: CommunityVisualization;
}
```

#### Vulnerability Assessment
```typescript
GET /api/v1/network/vulnerability

interface VulnerabilityResponse {
  critical_nodes: {
    ingredients: CriticalNode[];
    suppliers: CriticalNode[];
    products: CriticalNode[];
  };
  failure_scenarios: FailureScenario[];
  resilience_metrics: {
    network_robustness: number;
    supply_chain_redundancy: number;
    formulation_stability: number;
  };
  risk_mitigation: Recommendation[];
}
```

### Supply Chain Analysis

#### Supply Chain Network
```typescript
GET /api/v1/supply-chain/network?depth={depth}&focus={entityId}

interface SupplyChainNetworkResponse {
  network_graph: SupplyGraph;
  supply_paths: SupplyPath[];
  bottlenecks: Bottleneck[];
  dependencies: Dependency[];
  risk_assessment: {
    single_point_failures: string[];
    geographic_risks: GeographicRisk[];
    supplier_concentration: ConcentrationRisk[];
  };
}
```

#### Supply Chain Optimization
```typescript
POST /api/v1/supply-chain/optimize
Content-Type: application/json

interface OptimizationRequest {
  objective: "cost" | "resilience" | "lead_time" | "quality";
  constraints: {
    max_suppliers_per_ingredient?: number;
    min_backup_suppliers?: number;
    geographic_diversification?: boolean;
    quality_requirements?: QualityConstraints;
  };
  scenario_parameters?: ScenarioParameters;
}

interface OptimizationResponse {
  optimized_network: SupplyGraph;
  improvements: {
    cost_reduction?: number;
    resilience_improvement?: number;
    lead_time_reduction?: number;
    quality_enhancement?: number;
  };
  implementation_plan: ImplementationStep[];
  risk_assessment: RiskAssessment;
}
```

## Data Validation API

### Schema Validation

#### Validate Entity Schema
```typescript
POST /api/v1/validation/schema
Content-Type: application/json

interface SchemaValidationRequest {
  entity_type: "product" | "ingredient" | "formulation" | "supplier";
  data: any;
  validation_level: "basic" | "strict" | "comprehensive";
}

interface SchemaValidationResponse {
  is_valid: boolean;
  validation_errors: ValidationError[];
  validation_warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  compliance_score: number;
}
```

#### Cross-Reference Validation
```typescript
POST /api/v1/validation/cross-reference
Content-Type: application/json

interface CrossReferenceRequest {
  primary_entity: {
    type: string;
    id: string;
  };
  referenced_entities: Array<{
    type: string;
    id: string;
  }>;
}

interface CrossReferenceResponse {
  referential_integrity: boolean;
  missing_references: MissingReference[];
  circular_dependencies: CircularDependency[];
  orphaned_entities: OrphanedEntity[];
  recommendations: IntegrityRecommendation[];
}
```

## Query API

### Advanced Search

#### Multi-Entity Search
```typescript
GET /api/v1/search?q={query}&types={types}&filters={filters}&sort={sort}

interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacet[];
  total_count: number;
  search_time_ms: number;
  suggestions: SearchSuggestion[];
}

interface SearchResult {
  entity_type: string;
  entity_id: string;
  entity_data: any;
  relevance_score: number;
  highlighted_fields: Record<string, string>;
  related_entities: RelatedEntity[];
}
```

#### Graph Traversal
```typescript
POST /api/v1/graph/traverse
Content-Type: application/json

interface TraversalRequest {
  start_nodes: string[];
  traversal_rules: {
    max_depth: number;
    edge_types: string[];
    node_filters: NodeFilter[];
    path_constraints: PathConstraint[];
  };
  return_format: "nodes" | "paths" | "subgraph";
}

interface TraversalResponse {
  traversal_result: TraversalResult;
  paths_found: GraphPath[];
  nodes_visited: GraphNode[];
  traversal_statistics: TraversalStats;
}
```

## Real-time API

### Websocket Events

#### Network Updates
```typescript
// WebSocket endpoint: /ws/network-updates
interface NetworkUpdateEvent {
  event_type: "node_added" | "edge_added" | "node_updated" | "edge_removed";
  entity_type: string;
  entity_id: string;
  change_data: any;
  impact_assessment: ImpactAssessment;
  timestamp: string;
}
```

#### Analysis Progress
```typescript
// WebSocket endpoint: /ws/analysis-progress
interface AnalysisProgressEvent {
  analysis_id: string;
  progress_percentage: number;
  current_phase: string;
  estimated_completion: string;
  intermediate_results?: any;
}
```

## Error Handling

### Standard Error Response
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    request_id: string;
    timestamp: string;
  };
  validation_errors?: ValidationError[];
  suggestions?: string[];
}
```

### Error Codes
- `SCHEMA_VALIDATION_FAILED`: Schema validation errors
- `REFERENTIAL_INTEGRITY_ERROR`: Cross-reference validation failed
- `NETWORK_COMPUTATION_ERROR`: Hypergraph analysis failed
- `SUPPLY_CHAIN_INCONSISTENCY`: Supply chain validation errors
- `CONCENTRATION_LIMIT_EXCEEDED`: Formulation concentration errors
- `INSUFFICIENT_PERMISSIONS`: Authentication/authorization errors
- `RATE_LIMIT_EXCEEDED`: API rate limiting
- `INTERNAL_SERVER_ERROR`: Unexpected system errors

## Rate Limiting

### API Limits
- **Standard tier**: 1000 requests/hour
- **Professional tier**: 10,000 requests/hour  
- **Enterprise tier**: Unlimited
- **Bulk operations**: Separate limits apply
- **Real-time subscriptions**: Connection-based limits

## Authentication

### API Key Authentication
```http
Authorization: Bearer sk_live_your_api_key_here
```

### OAuth 2.0 Flow
```http
Authorization: Bearer oauth_access_token
```

## SDKs and Integration

### TypeScript SDK Example
```typescript
import { SkinTwinAPI } from '@skin-twin/api-client';

const client = new SkinTwinAPI({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.skin-twin.com/v1'
});

// Create a product
const product = await client.products.create({
  id: 'B19ABC001',
  label: 'Advanced Night Serum',
  category: 'Treatment',
  // ... other properties
});

// Analyze network
const analysis = await client.network.analyzeCentrality({
  type: 'betweenness',
  entity: 'ingredient'
});
```

This API documentation provides comprehensive access to the SKIN-TWIN hypergraph system, enabling developers to integrate formulation analysis, network insights, and supply chain optimization into their applications.