-- Enhanced Neon Schema for SKIN-TWIN Hypergraph
-- Generated on: 2025-11-09
-- Includes: Formulation History, Hypergraph Analytics, and Performance Optimizations

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS skin_twin;

-- ============================================================================
-- FORMULATION HISTORY TRACKING
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_formulation_history_id 
    ON skin_twin.formulation_history(formulation_id);
CREATE INDEX IF NOT EXISTS idx_formulation_history_timestamp 
    ON skin_twin.formulation_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_formulation_history_type 
    ON skin_twin.formulation_history(change_type);

-- ============================================================================
-- FORMULATION METADATA
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_formulations_status 
    ON skin_twin.formulations(status);
CREATE INDEX IF NOT EXISTS idx_formulations_created_at 
    ON skin_twin.formulations(created_at DESC);

-- ============================================================================
-- HYPERGRAPH EDGES (Enhanced)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_type 
    ON skin_twin.hypergraph_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_source 
    ON skin_twin.hypergraph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_target 
    ON skin_twin.hypergraph_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_weight 
    ON skin_twin.hypergraph_edges(weight DESC);

-- ============================================================================
-- HYPERGRAPH NODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS skin_twin.hypergraph_nodes (
    id VARCHAR(50) PRIMARY KEY,
    node_type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_type 
    ON skin_twin.hypergraph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_label 
    ON skin_twin.hypergraph_nodes(label);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- View: Node Statistics
CREATE OR REPLACE VIEW skin_twin.hypergraph_node_stats AS
SELECT 
    n.id,
    n.node_type,
    n.label,
    COUNT(DISTINCT e.id) as edge_count,
    AVG(e.weight) as avg_weight,
    MAX(e.weight) as max_weight,
    MIN(e.weight) as min_weight
FROM skin_twin.hypergraph_nodes n
LEFT JOIN skin_twin.hypergraph_edges e 
    ON n.id = e.source_id OR n.id = e.target_id
GROUP BY n.id, n.node_type, n.label;

-- View: Formulation Version History
CREATE OR REPLACE VIEW skin_twin.formulation_versions AS
SELECT 
    f.id,
    f.name,
    f.status,
    COUNT(h.version) as version_count,
    MAX(h.version) as latest_version,
    MAX(h.changed_at) as last_modified
FROM skin_twin.formulations f
LEFT JOIN skin_twin.formulation_history h 
    ON f.id = h.formulation_id
GROUP BY f.id, f.name, f.status;

-- View: Edge Type Distribution
CREATE OR REPLACE VIEW skin_twin.edge_type_stats AS
SELECT 
    edge_type,
    COUNT(*) as count,
    AVG(weight) as avg_weight,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM skin_twin.hypergraph_edges
GROUP BY edge_type;

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
    ON skin_twin.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp 
    ON skin_twin.audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user 
    ON skin_twin.audit_log(user_id);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Function: Get node neighbors
CREATE OR REPLACE FUNCTION skin_twin.get_node_neighbors(
    node_id VARCHAR(50),
    max_depth INTEGER DEFAULT 1
)
RETURNS TABLE (
    neighbor_id VARCHAR(50),
    depth INTEGER,
    path_weight DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE neighbors AS (
        -- Base case: direct neighbors
        SELECT 
            CASE 
                WHEN e.source_id = node_id THEN e.target_id
                ELSE e.source_id
            END as neighbor_id,
            1 as depth,
            e.weight as path_weight
        FROM skin_twin.hypergraph_edges e
        WHERE e.source_id = node_id OR e.target_id = node_id
        
        UNION
        
        -- Recursive case: neighbors of neighbors
        SELECT 
            CASE 
                WHEN e.source_id = n.neighbor_id THEN e.target_id
                ELSE e.source_id
            END as neighbor_id,
            n.depth + 1,
            n.path_weight * e.weight
        FROM neighbors n
        JOIN skin_twin.hypergraph_edges e 
            ON e.source_id = n.neighbor_id OR e.target_id = n.neighbor_id
        WHERE n.depth < max_depth
            AND CASE 
                WHEN e.source_id = n.neighbor_id THEN e.target_id
                ELSE e.source_id
            END != node_id
    )
    SELECT DISTINCT * FROM neighbors
    ORDER BY depth, path_weight DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate node centrality
CREATE OR REPLACE FUNCTION skin_twin.calculate_node_centrality(
    node_id VARCHAR(50)
)
RETURNS DECIMAL AS $$
DECLARE
    centrality DECIMAL;
BEGIN
    SELECT 
        COALESCE(SUM(weight), 0) / NULLIF(COUNT(*), 0)
    INTO centrality
    FROM skin_twin.hypergraph_edges
    WHERE source_id = node_id OR target_id = node_id;
    
    RETURN COALESCE(centrality, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION skin_twin.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_formulations_timestamp
    BEFORE UPDATE ON skin_twin.formulations
    FOR EACH ROW
    EXECUTE FUNCTION skin_twin.update_timestamp();

CREATE TRIGGER update_hypergraph_nodes_timestamp
    BEFORE UPDATE ON skin_twin.hypergraph_nodes
    FOR EACH ROW
    EXECUTE FUNCTION skin_twin.update_timestamp();

CREATE TRIGGER update_hypergraph_edges_timestamp
    BEFORE UPDATE ON skin_twin.hypergraph_edges
    FOR EACH ROW
    EXECUTE FUNCTION skin_twin.update_timestamp();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE skin_twin.formulation_history IS 
    'Tracks all changes to formulations with versioning support';
COMMENT ON TABLE skin_twin.formulations IS 
    'Main formulation metadata and current state';
COMMENT ON TABLE skin_twin.hypergraph_edges IS 
    'Edges in the hypergraph representing relationships between entities';
COMMENT ON TABLE skin_twin.hypergraph_nodes IS 
    'Nodes in the hypergraph representing entities';
COMMENT ON TABLE skin_twin.audit_log IS 
    'Comprehensive audit trail for all entity changes';
