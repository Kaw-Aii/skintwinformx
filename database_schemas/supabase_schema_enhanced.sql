-- Enhanced Supabase Schema for SKIN-TWIN Hypergraph
-- Generated on: 2025-11-09
-- Includes: Row Level Security, Real-time Support, and Enhanced Tables

-- ============================================================================
-- FORMULATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS formulations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    ingredients JSONB,
    properties JSONB
);

-- Enable Row Level Security
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for formulations
CREATE POLICY "Users can view their own formulations"
    ON formulations FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own formulations"
    ON formulations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own formulations"
    ON formulations FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own formulations"
    ON formulations FOR DELETE
    USING (auth.uid() = created_by);

-- ============================================================================
-- FORMULATION HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS formulation_history (
    id SERIAL PRIMARY KEY,
    formulation_id VARCHAR(50) NOT NULL REFERENCES formulations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    changes JSONB NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP DEFAULT NOW(),
    change_type VARCHAR(50),
    description TEXT,
    metadata JSONB,
    UNIQUE(formulation_id, version)
);

-- Enable Row Level Security
ALTER TABLE formulation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for formulation_history
CREATE POLICY "Users can view history of their formulations"
    ON formulation_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM formulations 
            WHERE formulations.id = formulation_history.formulation_id 
            AND formulations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert history for their formulations"
    ON formulation_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM formulations 
            WHERE formulations.id = formulation_history.formulation_id 
            AND formulations.created_by = auth.uid()
        )
    );

-- ============================================================================
-- HYPERGRAPH NODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS hypergraph_nodes (
    id VARCHAR(50) PRIMARY KEY,
    node_type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    properties JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hypergraph_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hypergraph_nodes (public read, authenticated write)
CREATE POLICY "Anyone can view nodes"
    ON hypergraph_nodes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert nodes"
    ON hypergraph_nodes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own nodes"
    ON hypergraph_nodes FOR UPDATE
    USING (auth.uid() = created_by);

-- ============================================================================
-- HYPERGRAPH EDGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS hypergraph_edges (
    id SERIAL PRIMARY KEY,
    edge_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(50) NOT NULL REFERENCES hypergraph_nodes(id) ON DELETE CASCADE,
    target_id VARCHAR(50) NOT NULL REFERENCES hypergraph_nodes(id) ON DELETE CASCADE,
    weight DECIMAL(10, 4) DEFAULT 1.0,
    properties JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hypergraph_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hypergraph_edges (public read, authenticated write)
CREATE POLICY "Anyone can view edges"
    ON hypergraph_edges FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert edges"
    ON hypergraph_edges FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own edges"
    ON hypergraph_edges FOR UPDATE
    USING (auth.uid() = created_by);

-- ============================================================================
-- USER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- SHARED FORMULATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS formulation_shares (
    id SERIAL PRIMARY KEY,
    formulation_id VARCHAR(50) NOT NULL REFERENCES formulations(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES auth.users(id),
    shared_with UUID REFERENCES auth.users(id),
    permission VARCHAR(20) DEFAULT 'view', -- 'view', 'edit', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(formulation_id, shared_with)
);

-- Enable Row Level Security
ALTER TABLE formulation_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for formulation_shares
CREATE POLICY "Users can view shares they created or received"
    ON formulation_shares FOR SELECT
    USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares for their formulations"
    ON formulation_shares FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM formulations 
            WHERE formulations.id = formulation_shares.formulation_id 
            AND formulations.created_by = auth.uid()
        )
    );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_formulations_status 
    ON formulations(status);
CREATE INDEX IF NOT EXISTS idx_formulations_created_by 
    ON formulations(created_by);
CREATE INDEX IF NOT EXISTS idx_formulations_created_at 
    ON formulations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_formulation_history_formulation_id 
    ON formulation_history(formulation_id);
CREATE INDEX IF NOT EXISTS idx_formulation_history_changed_at 
    ON formulation_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_type 
    ON hypergraph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_created_by 
    ON hypergraph_nodes(created_by);

CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_type 
    ON hypergraph_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_source 
    ON hypergraph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_target 
    ON hypergraph_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_created_by 
    ON hypergraph_edges(created_by);

CREATE INDEX IF NOT EXISTS idx_formulation_shares_formulation_id 
    ON formulation_shares(formulation_id);
CREATE INDEX IF NOT EXISTS idx_formulation_shares_shared_with 
    ON formulation_shares(shared_with);

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_formulations_updated_at
    BEFORE UPDATE ON formulations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hypergraph_nodes_updated_at
    BEFORE UPDATE ON hypergraph_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hypergraph_edges_updated_at
    BEFORE UPDATE ON hypergraph_edges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION TO AUTO-CREATE USER PROFILE
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- REAL-TIME PUBLICATION
-- ============================================================================

-- Enable real-time for formulations
ALTER PUBLICATION supabase_realtime ADD TABLE formulations;
ALTER PUBLICATION supabase_realtime ADD TABLE formulation_history;
ALTER PUBLICATION supabase_realtime ADD TABLE hypergraph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE hypergraph_edges;

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW formulation_stats AS
SELECT 
    f.id,
    f.name,
    f.status,
    f.created_by,
    COUNT(DISTINCT h.version) as version_count,
    MAX(h.changed_at) as last_modified,
    COUNT(DISTINCT s.shared_with) as share_count
FROM formulations f
LEFT JOIN formulation_history h ON f.id = h.formulation_id
LEFT JOIN formulation_shares s ON f.id = s.formulation_id
GROUP BY f.id, f.name, f.status, f.created_by;

CREATE OR REPLACE VIEW node_connectivity AS
SELECT 
    n.id,
    n.node_type,
    n.label,
    COUNT(DISTINCT e1.id) as outgoing_edges,
    COUNT(DISTINCT e2.id) as incoming_edges,
    COUNT(DISTINCT e1.id) + COUNT(DISTINCT e2.id) as total_edges
FROM hypergraph_nodes n
LEFT JOIN hypergraph_edges e1 ON n.id = e1.source_id
LEFT JOIN hypergraph_edges e2 ON n.id = e2.target_id
GROUP BY n.id, n.node_type, n.label;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE formulations IS 
    'User formulations with versioning and sharing support';
COMMENT ON TABLE formulation_history IS 
    'Complete history of formulation changes';
COMMENT ON TABLE hypergraph_nodes IS 
    'Nodes in the knowledge hypergraph';
COMMENT ON TABLE hypergraph_edges IS 
    'Edges connecting nodes in the hypergraph';
COMMENT ON TABLE user_profiles IS 
    'Extended user profile information';
COMMENT ON TABLE formulation_shares IS 
    'Formulation sharing and collaboration';
