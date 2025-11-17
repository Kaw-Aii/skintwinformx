-- Deploy skin_twin schema tables to Neon
-- Part 1: Core Tables

CREATE TABLE IF NOT EXISTS skin_twin.formulation_history (
    id SERIAL PRIMARY KEY,
    formulation_id VARCHAR(50) NOT NULL,
    version INTEGER NOT NULL,
    changes JSONB NOT NULL,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT NOW(),
    change_type VARCHAR(50),
    description TEXT,
    metadata JSONB,
    UNIQUE(formulation_id, version)
);

CREATE TABLE IF NOT EXISTS skin_twin.formulations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    ingredients JSONB,
    properties JSONB
);

CREATE TABLE IF NOT EXISTS skin_twin.hypergraph_edges (
    id SERIAL PRIMARY KEY,
    edge_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(50) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    weight DECIMAL(10, 4) DEFAULT 1.0,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skin_twin.hypergraph_nodes (
    id VARCHAR(50) PRIMARY KEY,
    node_type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skin_twin.audit_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    changes JSONB,
    metadata JSONB
);
