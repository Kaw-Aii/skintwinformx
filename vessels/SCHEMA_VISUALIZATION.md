# SKIN-TWIN Schema Visualization Documentation

## Overview

This document provides comprehensive visual representations of the SKIN-TWIN data schemas, showing relationships, data flows, and technical architecture through detailed mermaid diagrams.

## Entity Relationship Architecture

### Core Schema Relationships

```mermaid
erDiagram
    PRODUCT ||--o{ FORMULATION_EDGE : "contains"
    INGREDIENT ||--o{ FORMULATION_EDGE : "formulated_in"
    INGREDIENT ||--o{ SUPPLY_EDGE : "supplied_by"
    SUPPLIER ||--o{ SUPPLY_EDGE : "supplies"
    
    PRODUCT {
        string id PK "B19[A-Z0-9]+"
        string label "Product name"
        string category "Product category"
        int ingredient_count "Number of ingredients"
        float complexity_score "Calculated complexity"
        array target_skin_type "Target demographics"
        object formulation_phases "Manufacturing phases"
        array benefits "Product benefits"
        string shelf_life "Expiry timeline"
        object safety_assessment "Safety data"
        object clinical_results "Efficacy data"
        object cost_analysis "Financial metrics"
    }
    
    INGREDIENT {
        string id PK "R[0-9]{6}"
        string label "Ingredient name"
        string inci_name "INCI nomenclature"
        string category "Functional category"
        string molecular_weight "Molecular properties"
        object concentration_range "Usage limits"
        object ph_range "pH stability"
        string solubility "Solubility profile"
        array functions "Primary functions"
        object compatibility "Compatibility matrix"
        string safety_rating "Safety classification"
        float pricing_zar "Cost per unit"
        object supplier_info "Supply chain data"
        int usage_frequency "Usage statistics"
    }
    
    FORMULATION_EDGE {
        string source_id FK "Ingredient ID"
        string target_id FK "Product ID"
        float concentration "Usage percentage"
        string phase "Manufacturing phase"
        int edge_id PK "Unique edge identifier"
        string type "Relationship type"
        float stability_impact "Stability coefficient"
        object manufacturing_notes "Process details"
    }
    
    SUPPLY_EDGE {
        string ingredient_id FK "Ingredient ID"
        string supplier_id FK "Supplier ID"
        int lead_time_days "Delivery timeline"
        float unit_price_zar "Cost per unit"
        string quality_grade "Quality rating"
        object commercial_terms "Business terms"
        boolean active_status "Availability"
        object certifications "Quality certs"
    }
    
    SUPPLIER {
        string id PK "Code + Number"
        string label "Supplier name"
        string company_name "Legal entity"
        int ingredient_portfolio_size "Product range"
        array geographic_focus "Service regions"
        array specializations "Expertise areas"
        object contact_info "Contact details"
        object commercial_terms "Business terms"
        array certifications "Quality standards"
        object technical_support "Support services"
        object performance_metrics "KPIs"
    }
```

## Data Flow Architecture

### Hypergraph Data Processing Pipeline

```mermaid
flowchart TD
    subgraph "Data Input Layer"
        A[Product Data<br/>*.prod] --> D[Schema Validation]
        B[Ingredient Data<br/>*.inci] --> D
        C[Supplier Data<br/>*.supp] --> D
        E[Formulation Data<br/>*.formul] --> D
    end
    
    subgraph "Validation & Processing"
        D --> F[Referential Integrity Check]
        F --> G[Concentration Validation]
        G --> H[Supply Chain Validation]
        H --> I[Data Normalization]
    end
    
    subgraph "Hypergraph Construction"
        I --> J[Node Creation]
        I --> K[Edge Generation]
        J --> L[Hypergraph Assembly]
        K --> L
        L --> M[Network Metrics Calculation]
    end
    
    subgraph "Analysis Layer"
        M --> N[Centrality Analysis]
        M --> O[Community Detection]
        M --> P[Vulnerability Assessment]
        M --> Q[Supply Chain Analysis]
    end
    
    subgraph "Output & Visualization"
        N --> R[Network Visualizations]
        O --> S[Cluster Diagrams]
        P --> T[Risk Assessments]
        Q --> U[Supply Reports]
        R --> V[Dashboard Integration]
        S --> V
        T --> V
        U --> V
    end
    
    style D fill:#e1f5fe
    style L fill:#f3e5f5
    style V fill:#e8f5e8
```

## Schema Validation Architecture

### Validation Rules & Constraints

```mermaid
flowchart LR
    subgraph "Product Validation"
        A[Product Schema] --> A1[ID Format Check<br/>B19[A-Z0-9]+]
        A1 --> A2[Ingredient Count<br/>Validation]
        A2 --> A3[Concentration Sum<br/>≤ 100%]
        A3 --> A4[Benefits Array<br/>Not Empty]
        A4 --> A5[Complexity Score<br/>Calculation]
    end
    
    subgraph "Ingredient Validation"
        B[Ingredient Schema] --> B1[ID Format Check<br/>R[0-9]{6}]
        B1 --> B2[Concentration Range<br/>0.001% ≤ max ≤ 200%]
        B2 --> B3[Safety Rating<br/>Required]
        B3 --> B4[Usage Frequency<br/>Match Actual]
        B4 --> B5[Compatibility<br/>Matrix Check]
    end
    
    subgraph "Formulation Validation"
        C[Formulation Edge] --> C1[Source ID Exists<br/>in Ingredients]
        C1 --> C2[Target ID Exists<br/>in Products]
        C2 --> C3[Concentration Within<br/>Ingredient Range]
        C3 --> C4[Phase Consistency<br/>Check]
        C4 --> C5[Stability Impact<br/>Assessment]
    end
    
    subgraph "Supply Validation"
        D[Supply Edge] --> D1[Ingredient Exists<br/>Reference Check]
        D1 --> D2[Supplier Exists<br/>Reference Check]
        D2 --> D3[Lead Time > 0<br/>Positive Value]
        D3 --> D4[Unit Price > 0<br/>Positive Value]
        D4 --> D5[Quality Grade<br/>Specified]
    end
    
    subgraph "Cross-Validation"
        A5 --> E[Network Consistency]
        B5 --> E
        C5 --> E
        D5 --> E
        E --> F[Hypergraph Validation]
        F --> G[Final Schema Check]
    end
    
    style E fill:#fff3e0
    style F fill:#fce4ec
    style G fill:#e8f5e8
```

## Technical Implementation Schema

### Class Architecture & Dependencies

```mermaid
classDiagram
    class SchemaValidator {
        +validateProduct(product: Product): ValidationResult
        +validateIngredient(ingredient: Ingredient): ValidationResult
        +validateFormulation(formulation: FormulationEdge): ValidationResult
        +validateSupplyChain(supply: SupplyEdge): ValidationResult
        +crossValidate(schema: Schema): ValidationResult
        -checkReferentialIntegrity(): boolean
        -validateConcentrations(): boolean
        -assessSupplyChainCoverage(): boolean
    }
    
    class HypergraphBuilder {
        +buildFromSchema(schema: Schema): Hypergraph
        +addNodes(entities: Entity[]): void
        +addEdges(relationships: Relationship[]): void
        +calculateMetrics(): NetworkMetrics
        -constructNetworkLayers(): Layer[]
        -validateHypergraphStructure(): boolean
    }
    
    class NetworkAnalyzer {
        +calculateCentrality(graph: Hypergraph): CentralityMetrics
        +detectCommunities(graph: Hypergraph): Community[]
        +assessVulnerability(graph: Hypergraph): VulnerabilityReport
        +analyzeSupplyChain(graph: Hypergraph): SupplyChainMetrics
        -runModularityAnalysis(): ModularityScore
        -identifyCriticalPaths(): Path[]
    }
    
    class DataProcessor {
        +loadSchemaData(path: string): Schema
        +normalizeData(rawData: RawData): NormalizedData
        +exportResults(analysis: Analysis): ExportFormat
        -parseFileFormat(file: File): ParsedData
        -validateFileStructure(file: File): boolean
    }
    
    SchemaValidator --> HypergraphBuilder : "Validated Schema"
    HypergraphBuilder --> NetworkAnalyzer : "Constructed Hypergraph"
    NetworkAnalyzer --> DataProcessor : "Analysis Results"
    DataProcessor --> SchemaValidator : "Feedback Loop"
    
    class Product {
        +string id
        +string label
        +string category
        +int ingredient_count
        +float complexity_score
        +string[] target_skin_type
        +object formulation_phases
        +string[] benefits
    }
    
    class Ingredient {
        +string id
        +string label
        +string inci_name
        +string category
        +ConcentrationRange concentration_range
        +PhRange ph_range
        +string[] functions
        +CompatibilityMatrix compatibility
    }
    
    class FormulationEdge {
        +string source_id
        +string target_id
        +float concentration
        +string phase
        +int edge_id
        +float stability_impact
    }
    
    class SupplyEdge {
        +string ingredient_id
        +string supplier_id
        +int lead_time_days
        +float unit_price_zar
        +string quality_grade
        +boolean active_status
    }
    
    SchemaValidator --> Product
    SchemaValidator --> Ingredient
    SchemaValidator --> FormulationEdge
    SchemaValidator --> SupplyEdge
```

## Network Layer Architecture

### Multi-Layer Hypergraph Structure

```mermaid
graph TB
    subgraph "Layer 1: Product Network"
        P1[Daily Ultra Def SPF25]
        P2[Hydrating Essence]
        P3[Vitamin C Complex]
        P4[Barrier Recovery Cream]
        P5[BHA Toner]
    end
    
    subgraph "Layer 2: Ingredient Network"
        I1[De Ion Water]
        I2[Niacinamide]
        I3[Hyaluronic Acid]
        I4[Ceramide NP]
        I5[Salicylic Acid]
        I6[Glycerine]
        I7[Vitamin E]
        I8[Microcare PHG]
    end
    
    subgraph "Layer 3: Supplier Network"
        S1[BASF Personal Care]
        S2[Evonik Industries]
        S3[Botanichem]
        S4[Meganede CC]
        S5[Natchem CC]
    end
    
    subgraph "Cross-Layer Connections"
        P1 -.->|formulated_with| I1
        P1 -.->|formulated_with| I2
        P1 -.->|formulated_with| I6
        P2 -.->|formulated_with| I1
        P2 -.->|formulated_with| I3
        P3 -.->|formulated_with| I7
        P4 -.->|formulated_with| I4
        P5 -.->|formulated_with| I5
        
        I1 -.->|supplied_by| S3
        I2 -.->|supplied_by| S1
        I3 -.->|supplied_by| S4
        I4 -.->|supplied_by| S2
        I5 -.->|supplied_by| S1
        I6 -.->|supplied_by| S3
        I7 -.->|supplied_by| S1
        I8 -.->|supplied_by| S5
    end
    
    style P1 fill:#e3f2fd
    style P2 fill:#e3f2fd
    style P3 fill:#e3f2fd
    style P4 fill:#e3f2fd
    style P5 fill:#e3f2fd
    style I1 fill:#f3e5f5
    style I2 fill:#f3e5f5
    style I3 fill:#f3e5f5
    style I4 fill:#f3e5f5
    style I5 fill:#f3e5f5
    style I6 fill:#f3e5f5
    style I7 fill:#f3e5f5
    style I8 fill:#f3e5f5
    style S1 fill:#e8f5e8
    style S2 fill:#e8f5e8
    style S3 fill:#e8f5e8
    style S4 fill:#e8f5e8
    style S5 fill:#e8f5e8
```

## Query Pattern Architecture

### Common Analysis Queries

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Validator
    participant HypergraphEngine
    participant Database
    
    Client->>API: Query: Product Formulation Analysis
    API->>Validator: Validate Query Parameters
    Validator-->>API: Validation Result
    
    API->>HypergraphEngine: Execute Network Query
    HypergraphEngine->>Database: Fetch Product Data
    Database-->>HypergraphEngine: Product Schema Data
    
    HypergraphEngine->>Database: Fetch Related Ingredients
    Database-->>HypergraphEngine: Ingredient Schema Data
    
    HypergraphEngine->>Database: Fetch Supply Chain Data
    Database-->>HypergraphEngine: Supplier Schema Data
    
    HypergraphEngine->>HypergraphEngine: Build Network Subgraph
    HypergraphEngine->>HypergraphEngine: Calculate Metrics
    HypergraphEngine->>HypergraphEngine: Generate Visualization
    
    HypergraphEngine-->>API: Analysis Results
    API-->>Client: Formatted Response
    
    Note over Client,Database: Query Types: Centrality, Communities, Vulnerability, Supply Chain
```

## Integration Points

### Schema-to-Implementation Mapping

```mermaid
flowchart LR
    subgraph "Schema Layer"
        A[SCHEMA.md]
        B[HYPERGRAPH_INTEGRATION.md]
        C[Schema Validation Rules]
    end
    
    subgraph "Data Layer"
        D[*.prod files]
        E[*.inci files]
        F[*.formul files]
        G[*.supp files]
    end
    
    subgraph "Analysis Layer"
        H[README.md]
        I[ARCHITECTURE.md]
        J[NETWORK_ANALYSIS.md]
        K[SUMMARY.md]
    end
    
    subgraph "Application Layer"
        L[Formulation Engine]
        M[Supply Chain Monitor]
        N[Quality Validator]
        O[Cost Calculator]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    B --> H
    B --> I
    C --> J
    D --> L
    E --> M
    F --> N
    G --> O
    H --> L
    I --> M
    J --> N
    K --> O
    
    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#e1f5fe
    style H fill:#fff3e0
    style I fill:#fff3e0
    style J fill:#fff3e0
    style K fill:#fff3e0
```

## Performance Optimization Schema

### Scalability & Query Optimization

```mermaid
graph TD
    subgraph "Optimization Strategies"
        A[Indexing Strategy] --> A1[ID-based Primary Indexes]
        A --> A2[Category-based Secondary Indexes]
        A --> A3[Concentration Range Indexes]
        
        B[Caching Layer] --> B1[Frequently Accessed Nodes]
        B --> B2[Pre-computed Metrics]
        B --> B3[Query Result Cache]
        
        C[Data Partitioning] --> C1[By Product Category]
        C --> C2[By Ingredient Type]
        C --> C3[By Geographic Region]
        
        D[Query Optimization] --> D1[Batch Processing]
        D --> D2[Incremental Updates]
        D --> D3[Parallel Computation]
    end
    
    subgraph "Performance Metrics"
        E[Memory Usage] --> E1[Current: 2MB for 300 nodes]
        E --> E2[Projected: 45MB for 1500 nodes]
        
        F[Query Performance] --> F1[Simple: <1ms]
        F --> F2[Complex: <25ms]
        F --> F3[Full Analysis: <100ms]
        
        G[Scalability Limits] --> G1[10K nodes: Optimal]
        G --> G2[100K nodes: Performance tuning needed]
        G --> G3[1M nodes: Architecture revision required]
    end
    
    A1 --> E1
    B2 --> F1
    D2 --> F2
    C1 --> G1
```

This schema visualization documentation provides comprehensive technical insights into the SKIN-TWIN platform's data architecture, validation systems, and performance characteristics, directly supporting the hypergraph analysis framework described in the examples documentation.