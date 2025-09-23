-- Enhanced Hypergraph Schema for SkinTwin FormX
-- This schema supports advanced hypergraph analysis and visualization

-- Create hypergraph_nodes table
CREATE TABLE IF NOT EXISTS hypergraph_nodes (
  id varchar(255) PRIMARY KEY,
  type varchar(50) NOT NULL,
  label varchar(500) NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create hypergraph_edges table
CREATE TABLE IF NOT EXISTS hypergraph_edges (
  id varchar(255) PRIMARY KEY,
  source varchar(255) NOT NULL,
  target varchar(255) NOT NULL,
  type varchar(50) NOT NULL,
  properties jsonb DEFAULT '{}',
  weight decimal(10, 4) DEFAULT 1.0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create hypergraph_analysis table for storing analysis results
CREATE TABLE IF NOT EXISTS hypergraph_analysis (
  id serial PRIMARY KEY,
  analysis_type varchar(100) NOT NULL,
  parameters jsonb DEFAULT '{}',
  results jsonb NOT NULL,
  node_count integer NOT NULL,
  edge_count integer NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Create hypergraph_clusters table for community detection results
CREATE TABLE IF NOT EXISTS hypergraph_clusters (
  id serial PRIMARY KEY,
  analysis_id integer REFERENCES hypergraph_analysis(id) ON DELETE CASCADE,
  cluster_id varchar(100) NOT NULL,
  node_ids jsonb NOT NULL,
  cluster_size integer NOT NULL,
  modularity decimal(10, 6),
  created_at timestamp DEFAULT now()
);

-- Create hypergraph_metrics table for centrality and other metrics
CREATE TABLE IF NOT EXISTS hypergraph_metrics (
  id serial PRIMARY KEY,
  node_id varchar(255) NOT NULL,
  metric_type varchar(50) NOT NULL,
  metric_value decimal(15, 8) NOT NULL,
  analysis_id integer REFERENCES hypergraph_analysis(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_type ON hypergraph_nodes (type);
CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_label ON hypergraph_nodes (label);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_source ON hypergraph_edges (source);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_target ON hypergraph_edges (target);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_type ON hypergraph_edges (type);
CREATE INDEX IF NOT EXISTS idx_hypergraph_analysis_type ON hypergraph_analysis (analysis_type);
CREATE INDEX IF NOT EXISTS idx_hypergraph_clusters_analysis ON hypergraph_clusters (analysis_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_metrics_node ON hypergraph_metrics (node_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_metrics_type ON hypergraph_metrics (metric_type);

-- Create foreign key constraints for hypergraph_edges
ALTER TABLE hypergraph_edges 
ADD CONSTRAINT fk_hypergraph_edges_source 
FOREIGN KEY (source) REFERENCES hypergraph_nodes (id) ON DELETE CASCADE;

ALTER TABLE hypergraph_edges 
ADD CONSTRAINT fk_hypergraph_edges_target 
FOREIGN KEY (target) REFERENCES hypergraph_nodes (id) ON DELETE CASCADE;

-- Create views for common queries
CREATE OR REPLACE VIEW hypergraph_node_degrees AS
SELECT 
  n.id,
  n.type,
  n.label,
  COALESCE(in_degree.count, 0) as in_degree,
  COALESCE(out_degree.count, 0) as out_degree,
  COALESCE(in_degree.count, 0) + COALESCE(out_degree.count, 0) as total_degree
FROM hypergraph_nodes n
LEFT JOIN (
  SELECT target as node_id, COUNT(*) as count
  FROM hypergraph_edges
  GROUP BY target
) in_degree ON n.id = in_degree.node_id
LEFT JOIN (
  SELECT source as node_id, COUNT(*) as count
  FROM hypergraph_edges
  GROUP BY source
) out_degree ON n.id = out_degree.node_id;

-- Create view for edge statistics
CREATE OR REPLACE VIEW hypergraph_edge_stats AS
SELECT 
  type,
  COUNT(*) as edge_count,
  AVG(weight) as avg_weight,
  MIN(weight) as min_weight,
  MAX(weight) as max_weight
FROM hypergraph_edges
GROUP BY type;

-- Create view for network overview
CREATE OR REPLACE VIEW hypergraph_network_overview AS
SELECT 
  (SELECT COUNT(*) FROM hypergraph_nodes) as total_nodes,
  (SELECT COUNT(*) FROM hypergraph_edges) as total_edges,
  (SELECT COUNT(DISTINCT type) FROM hypergraph_nodes) as node_types,
  (SELECT COUNT(DISTINCT type) FROM hypergraph_edges) as edge_types,
  (SELECT AVG(total_degree) FROM hypergraph_node_degrees) as avg_degree,
  (SELECT MAX(total_degree) FROM hypergraph_node_degrees) as max_degree;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_hypergraph_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_hypergraph_nodes_updated_at
  BEFORE UPDATE ON hypergraph_nodes
  FOR EACH ROW EXECUTE FUNCTION update_hypergraph_updated_at();

CREATE TRIGGER update_hypergraph_edges_updated_at
  BEFORE UPDATE ON hypergraph_edges
  FOR EACH ROW EXECUTE FUNCTION update_hypergraph_updated_at();

-- Create function for calculating node centrality
CREATE OR REPLACE FUNCTION calculate_node_centrality(node_type varchar DEFAULT NULL)
RETURNS TABLE(
  node_id varchar,
  degree_centrality decimal,
  betweenness_centrality decimal,
  closeness_centrality decimal
) AS $$
BEGIN
  RETURN QUERY
  WITH node_degrees AS (
    SELECT 
      n.id,
      COALESCE(COUNT(e1.id), 0) + COALESCE(COUNT(e2.id), 0) as degree
    FROM hypergraph_nodes n
    LEFT JOIN hypergraph_edges e1 ON n.id = e1.source
    LEFT JOIN hypergraph_edges e2 ON n.id = e2.target
    WHERE node_type IS NULL OR n.type = node_type
    GROUP BY n.id
  ),
  max_degree AS (
    SELECT MAX(degree) as max_deg FROM node_degrees
  )
  SELECT 
    nd.id::varchar,
    (nd.degree::decimal / md.max_deg::decimal) as degree_centrality,
    0.0::decimal as betweenness_centrality, -- Placeholder for complex calculation
    0.0::decimal as closeness_centrality    -- Placeholder for complex calculation
  FROM node_degrees nd
  CROSS JOIN max_degree md
  ORDER BY degree_centrality DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function for finding shortest paths (simplified)
CREATE OR REPLACE FUNCTION find_shortest_path(source_node varchar, target_node varchar)
RETURNS TABLE(
  path_length integer,
  path_nodes varchar[]
) AS $$
BEGIN
  -- Simplified shortest path using recursive CTE
  RETURN QUERY
  WITH RECURSIVE path_search AS (
    -- Base case: start from source node
    SELECT 
      1 as length,
      ARRAY[source_node] as nodes,
      source_node as current_node
    
    UNION ALL
    
    -- Recursive case: extend path
    SELECT 
      ps.length + 1,
      ps.nodes || e.target,
      e.target
    FROM path_search ps
    JOIN hypergraph_edges e ON ps.current_node = e.source
    WHERE 
      ps.length < 10 -- Limit search depth
      AND NOT (e.target = ANY(ps.nodes)) -- Avoid cycles
      AND e.target != target_node
  )
  SELECT 
    ps.length + 1 as path_length,
    ps.nodes || target_node as path_nodes
  FROM path_search ps
  JOIN hypergraph_edges e ON ps.current_node = e.source
  WHERE e.target = target_node
  ORDER BY ps.length
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
-- This can be uncommented for development/testing purposes
/*
INSERT INTO hypergraph_nodes (id, type, label, properties) VALUES
('ingredient_1', 'ingredient', 'Hyaluronic Acid', '{"cas_number": "9067-32-7", "function": "humectant"}'),
('ingredient_2', 'ingredient', 'Vitamin C', '{"cas_number": "50-81-7", "function": "antioxidant"}'),
('formulation_1', 'formulation', 'Anti-Aging Serum', '{"type": "serum", "complexity": 8}'),
('product_1', 'product', 'Youth Renewal Serum', '{"category": "skincare", "target_market": "premium"}');

INSERT INTO hypergraph_edges (id, source, target, type, properties, weight) VALUES
('edge_1', 'ingredient_1', 'formulation_1', 'contains', '{"concentration": 2.0}', 1.0),
('edge_2', 'ingredient_2', 'formulation_1', 'contains', '{"concentration": 15.0}', 1.5),
('edge_3', 'formulation_1', 'product_1', 'implements', '{"version": "1.0"}', 1.0);
*/
