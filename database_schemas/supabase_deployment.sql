-- SUPABASE Database Deployment Script
-- Generated: 2025-11-17T10:09:23.341Z

-- ============================================================================
-- SCHEMA DEPLOYMENT
-- ============================================================================

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


-- ============================================================================
-- DATA LOADING
-- ============================================================================

-- Loading ingredients (91 records)

    INSERT INTO skin_twin.ingredients (id, label, timeset, modularity_class, availability_status, research_notes, contact_required, strategic_priority, supplier_id)
    VALUES ('R1907000', 'Perf Citrus Therm 701081', NULL, 1, 'Unknown', 'Requires verification with 06 Agencies', true, 'Low', '06A0001'),
    ('R1908000', 'Azulene Pure (659833) *GRAM', NULL, 2, 'Unknown', 'Requires verification with A&E Connock', true, 'Low', 'AEC001'),
    ('R1902003', 'Iselux Ultra Mild', NULL, 3, 'Unknown', 'Requires verification with AECI', true, 'Medium', 'AKU001'),
    ('R1905039', 'Epigenist LS10003', NULL, 4, 'Available', 'BASF Care Creations ingredient via Botanichem', false, 'High', 'BOT0003'),
    ('R1905042', 'Eperuline PW LS 9627', NULL, 4, 'Available', 'BASF Care Creations ingredient via Botanichem', false, 'High', 'BOT0003'),
    ('R1905011', 'CM-Glucan Granulate', NULL, 5, 'Available', 'Advanced peptide ingredient via Carst&Walker', false, 'High', 'CAR0002'),
    ('R1905012', 'Perfection Peptide P3', NULL, 5, 'Available', 'Advanced peptide ingredient via Carst&Walker', false, 'High', 'CAR0002'),
    ('R1905023', 'AquaCacteen', NULL, 5, 'Available', 'Natural active ingredient via Carst&Walker', false, 'High', 'CAR0002'),
    ('R1905024', 'Happybelle-PE', NULL, 5, 'Available', 'Natural active ingredient via Carst&Walker', false, 'High', 'CAR0002'),
    ('R1905047', 'Gatuline Derma - Sensitive', NULL, 5, 'Available', 'Sensitive skin active via Carst&Walker', false, 'High', 'CAR0002'),
    ('R1911000', 'Sucragel AOF', NULL, 5, 'Available', 'Rheology modifier via Carst&Walker', false, 'Medium', 'CAR0002'),
    ('R1911001', 'Carbopol Ultrez 30', NULL, 5, 'Available', 'Rheology modifier via Carst&Walker', false, 'Medium', 'CAR0002'),
    ('R1911003', 'Carbopol EDT 2050', NULL, 5, 'Available', 'Rheology modifier via Carst&Walker', false, 'Medium', 'CAR0002'),
    ('R1905016', 'Regu-Stretch', NULL, 6, 'Unknown', 'Requires verification with Chempure', true, 'Medium', 'CHE0004'),
    ('R1905017', 'Alpaflor Imperatoria', NULL, 6, 'Unknown', 'Requires verification with Chempure', true, 'Medium', 'CHE0004'),
    ('R1905021', 'L-Carnitine', NULL, 6, 'Unknown', 'Requires verification with Chempure', true, 'Medium', 'CHE0004'),
    ('R1901001', 'Pomegranate Seed Oil', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1901006', 'Borage Oil Refined GLA 20PCT', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1902000', 'Oronal LCG', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1902001', 'Proteol OAT', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1905014', 'Sepicalm S', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1906000', 'Montanov L', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1906001', 'Montanov S', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1911002', 'Sepimax Zen', NULL, 7, 'Unknown', 'Requires verification with CJP Chemicals', true, 'Medium', 'CJP0001'),
    ('R1913014', 'Grapefruit Oil Pink', NULL, 8, 'Unknown', 'Requires verification with Clive Teubes CC', true, 'Low', 'CLI0001'),
    ('R1905004', 'Hyaluronic Acid HMW', NULL, 9, 'Unknown', 'Requires verification with Cosmetic Ingredients', true, 'High', 'COS0007'),
    ('R1901005', 'Arlamol LST-LQ-(MH)', NULL, 10, 'Available', 'Croda emollient ingredient', false, 'High', 'CRO0001'),
    ('R1905002', 'Chronodyn', NULL, 10, 'Available', 'Croda anti-aging active', false, 'High', 'CRO0001'),
    ('R1905003', 'Biopeptide CL', NULL, 10, 'Available', 'Croda peptide ingredient', false, 'High', 'CRO0001'),
    ('R1905025', 'Skin Tightener-ST(TM) PH', NULL, 10, 'Available', 'Croda firming active', false, 'High', 'CRO0001'),
    ('R1905026', 'Beautifeye', NULL, 10, 'Available', 'Croda eye care active', false, 'High', 'CRO0001'),
    ('R1905033', 'Evermat', NULL, 10, 'Available', 'Croda mattifying active', false, 'High', 'CRO0001'),
    ('R1905034', 'Intenslim', NULL, 10, 'Available', 'Croda slimming active', false, 'High', 'CRO0001'),
    ('R1901002', 'Cetiol Sensoft', NULL, 11, 'Unknown', 'Requires verification with Chemgrit Cosmetics', true, 'Medium', 'CTE0001'),
    ('R1901003', 'Cetiol B', NULL, 11, 'Unknown', 'Requires verification with Chemgrit Cosmetics', true, 'Medium', 'CTE0001'),
    ('R1905019', 'Exfo-Bio', NULL, 11, 'Unknown', 'Requires verification with Chemgrit Cosmetics', true, 'Medium', 'CTE0001'),
    ('R1905029', 'Cosmedia DC', NULL, 11, 'Unknown', 'Requires verification with Chemgrit Cosmetics', true, 'Medium', 'CTE0001'),
    ('R1905030', 'Uvinul T150', NULL, 11, 'Unknown', 'Requires verification with Chemgrit Cosmetics', true, 'Medium', 'CTE0001'),
    ('R1905043', 'Cetiol SB45', NULL, 11, 'Unknown', 'Requires verification with Chemgrit Cosmetics', true, 'Medium', 'CTE0001'),
    ('R1905015', 'Aerosil R972', NULL, 12, 'Unknown', 'Requires verification with Protea Chemicals', true, 'Low', 'EVO0001'),
    ('R1905022', 'Drieline 1S', NULL, 13, 'Unknown', 'Requires verification with Orkila', true, 'Low', 'HEX0001'),
    ('R1905008', 'Hydranov P', NULL, 14, 'Unknown', 'Requires verification with Vantage Speciality', true, 'Medium', 'LIP0001'),
    ('R1905055', 'Ceramidone', NULL, 14, 'Unknown', 'Requires verification with Vantage Speciality', true, 'Medium', 'LIP0001'),
    ('R1905000', 'Allistin P5', NULL, 15, 'Unknown', 'Requires verification with Exsymol', true, 'Low', 'Maccullum'),
    ('R1905020', 'LPD''s Asiatic Centella', NULL, 16, 'Unknown', 'Requires verification with Materia Medica', true, 'Medium', 'MAT0002'),
    ('R1905018', 'Glyco Repair', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905027', 'Deglysome', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905035', 'Sebonormine OP', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905041', 'Unflamagyl', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905046', 'Dermapur HP OP', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905048', 'Vitagenyl', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905049', 'Detoxyl OP', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905050', 'Celldetox', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905051', 'Mitokinyl', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905052', 'Fermiskin GR', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905053', 'Retilactyl D', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905054', 'Raffermine 2', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905056', 'Eternaline', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905057', 'Oxygeskin', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905058', 'Aquaphyline EL', NULL, 17, 'Available', 'Silab ingredient via Meganede CC', true, 'High', 'MEG0001'),
    ('R1905009', 'Caffeine', NULL, 18, 'Unknown', 'Requires verification with Merck', true, 'Medium', 'MER0001'),
    ('R1905010', 'Malic Acid', NULL, 18, 'Unknown', 'Requires verification with Merck', true, 'Medium', 'MER0001'),
    ('R1905032', 'Ronacare AP', NULL, 18, 'Unknown', 'Requires verification with Merck', true, 'Medium', 'MER0001'),
    ('R1905044', 'Acnacidol BG', NULL, 19, 'Unknown', 'Requires verification with Millchem', true, 'Low', 'MIL0001'),
    ('R1905001', 'Rayolys D', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1905037', 'ARP 100', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1905045', 'Meadowsweet Medulat 220016', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913000', 'Ivy Cosmelene Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913001', 'St John''s Wort HG Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913002', 'Soapwort HG (3009) Extr', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913003', 'Horsetail Cosmelene Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913004', 'Centella Asiatica Cosmelene Ex', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913005', 'Yarrow Phytelene EG 472 Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913006', 'Geranium HG Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913007', 'Lavender HG Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913008', 'Rosemary HG Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913009', 'Arnica Phytenele EG 001 Ext', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913011', 'Phytelene EGX 247 (BG) 620012', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913012', 'Phytelene EGX 773 (BG) 620032', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1913013', 'Passion Flower Cosmelene', NULL, 20, 'Available', 'Greentech botanical via Natchem CC', true, 'High', 'NAT0001'),
    ('R1902002', 'Rewoderm S1333 KM 5', NULL, 21, 'Unknown', 'Requires verification with Orchem', true, 'Medium', 'ORC0001'),
    ('R1902999', 'ColaMate RM / replacement Rewoderm S1333 KM 5', NULL, 21, 'Unknown', 'Requires verification with Orchem', true, 'Medium', 'ORC0001'),
    ('R1901004', 'Waglinol 3/929', NULL, 22, 'Unknown', 'Requires verification with Savannah Fine Chem', true, 'Medium', 'SAV0001'),
    ('R1905005', 'AA2G', NULL, 22, 'Unknown', 'Requires verification with Savannah Fine Chem', true, 'Medium', 'SAV0001'),
    ('R1905006', 'Hydromanil', NULL, 22, 'Unknown', 'Requires verification with Savannah Fine Chem', true, 'Medium', 'SAV0001'),
    ('R1905007', 'Acquacell', NULL, 22, 'Unknown', 'Requires verification with Savannah Fine Chem', true, 'Medium', 'SAV0001'),
    ('R1905031', 'Ten''s Up', NULL, 22, 'Unknown', 'Requires verification with Savannah Fine Chem', true, 'Medium', 'SAV0001'),
    ('R1905028', 'Celligent', NULL, 23, 'Unknown', 'Requires verification with IMCD South Africa', true, 'Medium', 'SIY0002'),
    ('R1905040', 'Defensil Plus', NULL, 23, 'Unknown', 'Requires verification with IMCD South Africa', true, 'Medium', 'SIY0002'),
    ('R1905013', 'Genencare OSMS BA', NULL, 23, 'Unknown', 'Requires verification with IMCD South Africa', true, 'Medium', 'TCC0001'),
    ('R1905038', 'ProRenew Complex CLR', NULL, 23, 'Unknown', 'Requires verification with IMCD South Africa', true, 'Medium', 'TCC0001')
    ON CONFLICT DO NOTHING;
  

-- Loading edges (91 records)

    INSERT INTO skin_twin.edges (source, target, type, label, timeset, weight)
    VALUES ('R1907000', '06A0001', 'Directed', NULL, NULL, 1),
    ('R1908000', 'AEC001', 'Directed', NULL, NULL, 1),
    ('R1902003', 'AKU001', 'Directed', NULL, NULL, 1),
    ('R1905039', 'BOT0003', 'Directed', NULL, NULL, 1),
    ('R1905042', 'BOT0003', 'Directed', NULL, NULL, 1),
    ('R1905011', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1905012', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1905023', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1905024', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1905047', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1911000', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1911001', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1911003', 'CAR0002', 'Directed', NULL, NULL, 1),
    ('R1905016', 'CHE0004', 'Directed', NULL, NULL, 1),
    ('R1905017', 'CHE0004', 'Directed', NULL, NULL, 1),
    ('R1905021', 'CHE0004', 'Directed', NULL, NULL, 1),
    ('R1901001', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1901006', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1902000', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1902001', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1905014', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1906000', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1906001', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1911002', 'CJP0001', 'Directed', NULL, NULL, 1),
    ('R1913014', 'CLI0001', 'Directed', NULL, NULL, 1),
    ('R1905004', 'COS0007', 'Directed', NULL, NULL, 1),
    ('R1901005', 'CRO0001', 'Directed', NULL, NULL, 1),
    ('R1905002', 'CRO0001', 'Directed', NULL, NULL, 1),
    ('R1905003', 'CRO0001', 'Directed', NULL, NULL, 1),
    ('R1905025', 'CRO0001', 'Directed', NULL, NULL, 1),
    ('R1905026', 'CRO0001', 'Directed', NULL, NULL, 1),
    ('R1905033', 'CRO0001', 'Directed', NULL, NULL, 1),
    ('R1905034', 'CRO0001', 'Directed', NULL, NULL, 1),
    ('R1901002', 'CTE0001', 'Directed', NULL, NULL, 1),
    ('R1901003', 'CTE0001', 'Directed', NULL, NULL, 1),
    ('R1905019', 'CTE0001', 'Directed', NULL, NULL, 1),
    ('R1905029', 'CTE0001', 'Directed', NULL, NULL, 1),
    ('R1905030', 'CTE0001', 'Directed', NULL, NULL, 1),
    ('R1905043', 'CTE0001', 'Directed', NULL, NULL, 1),
    ('R1905015', 'EVO0001', 'Directed', NULL, NULL, 1),
    ('R1905022', 'HEX0001', 'Directed', NULL, NULL, 1),
    ('R1905008', 'LIP0001', 'Directed', NULL, NULL, 1),
    ('R1905055', 'LIP0001', 'Directed', NULL, NULL, 1),
    ('R1905000', 'Maccullum', 'Directed', NULL, NULL, 1),
    ('R1905020', 'MAT0002', 'Directed', NULL, NULL, 1),
    ('R1905018', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905027', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905035', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905041', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905046', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905048', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905049', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905050', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905051', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905052', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905053', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905054', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905056', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905057', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905058', 'MEG0001', 'Directed', NULL, NULL, 1),
    ('R1905009', 'MER0001', 'Directed', NULL, NULL, 1),
    ('R1905010', 'MER0001', 'Directed', NULL, NULL, 1),
    ('R1905032', 'MER0001', 'Directed', NULL, NULL, 1),
    ('R1905044', 'MIL0001', 'Directed', NULL, NULL, 1),
    ('R1905001', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1905037', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1905045', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913000', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913001', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913002', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913003', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913004', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913005', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913006', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913007', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913008', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913009', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913011', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913012', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1913013', 'NAT0001', 'Directed', NULL, NULL, 1),
    ('R1902002', 'ORC0001', 'Directed', NULL, NULL, 1),
    ('R1902999', 'ORC0001', 'Directed', NULL, NULL, 1),
    ('R1901004', 'SAV0001', 'Directed', NULL, NULL, 1),
    ('R1905005', 'SAV0001', 'Directed', NULL, NULL, 1),
    ('R1905006', 'SAV0001', 'Directed', NULL, NULL, 1),
    ('R1905007', 'SAV0001', 'Directed', NULL, NULL, 1),
    ('R1905031', 'SAV0001', 'Directed', NULL, NULL, 1),
    ('R1905028', 'SIY0002', 'Directed', NULL, NULL, 1),
    ('R1905040', 'SIY0002', 'Directed', NULL, NULL, 1),
    ('R1905013', 'TCC0001', 'Directed', NULL, NULL, 1),
    ('R1905038', 'TCC0001', 'Directed', NULL, NULL, 1)
    ON CONFLICT DO NOTHING;
  

-- Loading capabilities (23 records)

    INSERT INTO skin_twin.capabilities (supplier_id, supplier_name, ingredients_count, availability_confirmed, business_model, technical_support, innovation_focus, certifications, contact_info, strategic_priority, supply_chain_risk, cost_tier)
    VALUES ('MEG0001', 'Meganede CC', 16, 'Confirmed', 'Distributor', 'Yes', 'Natural Actives', 'Meganede CC distributes products from suppliers like Silab, which has various certifications (e.g., EcoVadis Platinum status mentioned on Silab''s news page). Specific certifications for Meganede CC itself are not explicitly stated on their website.', 'Email: info@meganede.com, Phone: +27 66 448 2860, +27 73 513 5984, Location: Bedfordview, Johannesburg', 'High', 'Low', 'Premium'),
    ('NAT0001', 'Natchem CC', 60, 'Unknown', 'Distributor', 'Yes', 'Botanicals', 'BEE (Black Economic Empowerment) certified.', 'Telephone: 010 010 6174, WhatsApp: +27 82 331 4508, Email for orders: online@natchem.co.za', 'High', 'Medium', 'Mid-Range'),
    ('CRO0001', 'Croda Chemicals S.A (Pty) Ltd', 630, 'Confirmed', 'Direct Manufacturer', 'Yes', 'Biotechnology', 'ISO 9001, ISO 14001, EFfCI GMP, USDA Biopreferred Program, Vegan-suitable, Halal, COSMOS, RSPO Mass Balance.', 'Contact Us form, Live Chat, Technical Library', 'High', 'Medium', 'Premium'),
    ('CAR0002', 'Carst&Walker div of Zenith Ho', 8, 'Confirmed', 'Distributor', 'Yes', 'Synthetic/Natural', 'Multiple', '+27 11 489 3600', 'High', 'Low', 'Mid-Range'),
    ('BOT0003', 'Botanichem', 162, 'Confirmed', 'Full Service Agency', 'Yes', 'Plant-Derived', 'Not explicitly stated, but focus on plant-derived, organic and safe products implies certain standards. BASF Care Creations products may have their own certifications.', 'Email: info@botanichem.co.za, Tel: 011 425 2206', 'High', 'Low', 'Premium'),
    ('CJP0001', 'CJP Chemicals (Pty) Ltd', 428, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'BBBEE Level 4, RSPO (Roundtable on Sustainable Palm Oil) member since 2019', 'Telephone: +27 11 494 6700, Fax: +27 11 494 6701, Email: info@cjpchemicals.co.za, Physical Address: 60 Electron Avenue, Isando, 1600, Johannesburg, South Africa, Postal Address: P. O. Box 1353, Cresta 2118, Johannesburg, South Africa', 'High (due to market leadership, broad product range, and commitment to sustainability)', 'Low (due to extensive distribution network, focus on supply chain partnerships, and RSPO membership for sustainable sourcing)', 'Unknown'),
    ('CTE0001', 'Chemgrit Cosmetics (C-Tec)', 30, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'EcoVadis Gold status (Brenntag), Top 10 Suppliers for Beauty & Personal Care by SpecialChem (Brenntag)', 'Contact via Brenntag South Africa website: https://www.brenntag.com/en-za/industries/beauty-and-personal-care/ (Contact form available on page)', 'High', 'Low (due to Brenntag''s global leadership and robust supply chain management)', 'Unknown'),
    ('SAV0001', 'Savannah Fine Chem (Pty) Ltd', 25, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'ISO 9001:2015, FSSC 22000 v6, FSSC 24000 v1', 'Johannesburg: Tel: +27 11 856 4500, Email: info@savannah.co.za, Office: 19 Boeing Road West, Morninghill, Bedfordview, 2007, Warehouse: 19 Steele Street, Steeledale, JHB; Cape Town: Tel: +27 21 830 5306, Email: info@savannah.co.za, Office: Spaces Century City, No 1 Bridgeway Road, Bridgeways Precinct, Century City, Cape Town, 7441, Warehouse: 5-7 Ipswitch Street, Hagley, Kuilsriver, Cape Town; Durban: Tel: +27 31 313 3338, Email: info@savannah.co.za, Office: Connect Space Musgrave, 2nd Floor 102 Stephen Dlamini Road, Durban 4001, Warehouse: 57 Joyner Road, Joggie Vermooten Park, Prospecton, Durban, Warehouse Tel: +27 31 940 3010', 'High', 'Low', 'Unknown'),
    ('CHE0004', 'Chempure (Pty) Ltd', 136, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'Not explicitly stated on the website, but they mention "rigorously tested for consistent, highest quality" and represent "multi-national, world-class principal suppliers."', 'Tel: 012 349-1543/4/5/6, queries@chempure.co.za', 'High', 'Low (Implied by representing ''multi-national, world-class principal suppliers'' and providing ''excellent service in the supply chain'')', 'Unknown'),
    ('MER0001', 'Merck (Pty) Ltd', 5, 'Unknown', 'Direct Manufacturer', 'Yes', 'Pharmaceuticals', 'Halal, vegan, ISO 16128 (100% NOC), COSMOS, NATRUE (associated with RonaCare products under Susonity)', 'Address: 1, Friesland Drive, Longmeadow Business Estate, Modderfontein, 1645, South Africa; Phone: +27 11 372 5000, 0860063725; Email: merck4sme@merckgroup.com', 'Low', 'Medium', 'Premium'),
    ('SIY0002', 'IMCD South Africa (Pty) Ltd', 194, 'Confirmed', 'Distributor', 'Yes', 'Specialty Chemicals', 'ISO 9001:2015 (valid until 21-07-2026), BEE verification certificate - Level 6 Contributor (60% Procurement Recognition Level). Individual products may have Halal, COSMOS, non-GMO, RSPO, etc. certifications.', 'Phone: +27 11 570 4260, +27 (0)11 293 2000. Address: 275 Oak Avenue, Ferndale, Randburg, 2194, South Africa. (Email via contact form on website)', 'High', 'Low', 'Mid-Range'),
    ('ORC0001', 'Orchem', 2, 'Confirmed', 'Unknown', 'Limited', 'Unknown', 'Unknown', 'Johannesburg Office: Tel: +27 11 465 6353, management@orchem.co.za; Durban Office: Tel: +27 31 100 80 40, management@orchem.co.za', 'Medium', 'Medium', 'Unknown'),
    ('LIP0001', 'Vantage Speciality Chemicals', 315, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'China Compliant, COSMOS, Ecocert, Halal, ISO 16128, Kosher, NATRUE, Organic, RSPO, Vegan', '170 Roan Crescent, Corporate Park North Midrand 1685, South Africa; Tel: +27 11 314 0912', 'Medium', 'Low', 'Unknown'),
    ('AKU001', 'AECI', 1, 'Confirmed', 'Direct Manufacturer', 'Yes', 'Industrial Chemicals', 'Responsible Care Initiative of the Year award (CAIA) 2022, Signatories of the Responsible Care Pledge. Specific product certifications (SDS, COA) available via QR code on product labels.', 'AECI Specialty Chemicals: T +27 11 922 1600, E specialtychemicals@aeciworld.com', 'High', 'Low', 'Mid-Range'),
    ('AEC001', 'A&E Connock', 232, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'Not explicitly stated on the website, but some search results mention HACCP, FDA, and Kosher certifications for some products. Further investigation would be needed for a comprehensive list.', 'Phone: +44 (0)1425 653367, Email: sales@connock.com', 'Medium', 'Low', 'Unknown'),
    ('CLI0001', 'Clive Teubes CC / Scatters Oils', 64, 'Confirmed', 'Unknown', 'Yes', 'Essential Oils', 'ISO 22000, Halaal Certification, Kosher Certification, HACCP Certification', 'Physical Address: 75 Wakis Avenue, Strydom Park, Randburg, South Africa; Postal Address: PO Box 4919, Randburg 2125, South Africa; Telephone: +27 11 792 4451, +27 11 792 4452; Fax: +27 11 792 1110; Email: deliwe@teubes.com', 'High', 'Low', 'Unknown'),
    ('COS0007', 'Cosmetic Ingredients (Pty) Ltd', 50, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'Many ingredients are COSMOS / Eco-Certified or vegan. Kobo Products has some COSMOS approved raw materials. Assessa has natural and marine-derived ingredients, many with Eco-certification.', 'Physical Address: Hennopspark, Centurion; Work Hours: Monday to Friday: 8:30 - 16:30; Email Address: info@cosmetic-ingredients.co.za; Phone Number: +27 12 653 3376', 'High', 'Low', 'Unknown'),
    ('EVO0001', 'Protea Chemicals', 1, 'Unknown', 'Unknown', 'Yes', 'Unknown', 'ISO 9001, 14001 and 18001 certified. Signatory to the Responsible Care® programme.', 'Head office: Wadeville, South Africa +27 (0) 11 323 3000, Email: info@proteamining.co.za', 'Medium', 'Medium', 'Unknown'),
    ('HEX0001', 'Orkila', 15, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'REACH compliant, regularly audited facilities compliant to highest local quality systems, active in Responsible Care or Responsible Distribution principles.', 'Colleen Maroun, Business Manager, T: +27 83 785 0998, E: Colleen.maroun@azelis.co.za', 'High', 'Low', 'Unknown'),
    ('Maccullum', 'Exsymol', 12, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'Not explicitly stated for Biosil Technologies, but Exsymol has EcoVadis GOLD certification.', 'Biosil Technologies South Africa: Tel: +27 (0)11 314 0912, Fax: +27 (0)11 314 0912. Email: customerservice@exsymol.com (for Exsymol directly)', 'High', 'Medium (due to international supplier with local distributor, potential for import/logistics challenges, but established distribution network mitigates some risk)', 'Unknown'),
    ('MAT0002', 'Materia Medica', 1, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'Not explicitly stated on website; further inquiry needed.', 'Phone: +27 72 731 3909, Fax: +27 86 243 4777, E-mail: chantal@materiamedica.co.za', 'Medium', 'Unknown (due to lack of detailed product and operational information)', 'Unknown'),
    ('MIL0001', 'Millchem', 1, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'Not explicitly stated on the website, but they have laboratories for quality control and product development.', 'Phone: +27 (0)11 974 2255, +27 (0)21 557 6527; Postal Address: PO Box 8595, Edenglen, 1613; Physical Address: 90 Newton Road, Meadowdale, 1600', 'High', 'Low (due to established infrastructure, multiple locations, and long-standing supplier relationships, despite general South African supply chain challenges)', 'Unknown'),
    ('06A0001', '06 Agencies', 5, 'Confirmed', 'Unknown', 'Yes', 'Unknown', 'Not specified on the website.', 'Adam: 083 297 4133 | adam@o6southafrica.com; McQueen: 060 434 4016 | mcqueen@o6southafrica.com; Richard: 082 821 2540 | richard@o6southafrica.com; Office Contact Number: 011 234 8399; Address: 258 Roan Crescent, Corporate Park North, Midrand, 1685', 'Medium', 'Low', 'Unknown')
    ON CONFLICT DO NOTHING;
  

-- Loading suppliers (23 records)

    INSERT INTO skin_twin.suppliers (id, label, timeset, modularity_class, availability_status, research_notes, contact_required, strategic_priority, website_url, product_count, pricing_available, new_products, discontinued_products, technical_support, certifications, supply_chain_risk, contact_info, last_updated)
    VALUES ('06A0001', '06 Agencies', NULL, 1, 'Available', '06 Agencies (o6southafrica.com) is a South African chemical agency specializing in fragrances and flavors. While they don''t explicitly list individual chemical ingredients, their ''Personal Care'' section under ''Fragrance'' indicates offerings for ''Hair Care'', ''Wash Off / Leave on Skin'', ''Baby Care'', ''Men’s Grooming'', and ''Deodorants''. This suggests they supply fragrance compounds suitable for these skincare and personal care applications. The website emphasizes customer service, rapid turnaround times, and a focus on emotional connection through scent. Pricing information is not publicly available, requiring direct inquiry. No specific quality certifications were found on the website. Their primary focus appears to be on finished fragrance formulations rather than raw chemical ingredients.', false, 'Medium', 'https://o6southafrica.com/', 5, false, 'None explicitly mentioned.', 'None explicitly mentioned.', 'Implied strong technical support through their team''s expertise in perfuming and brand alignment.', 'Not specified on the website.', 'Low', 'Adam: 083 297 4133 | adam@o6southafrica.com; McQueen: 060 434 4016 | mcqueen@o6southafrica.com; Richard: 082 821 2540 | richard@o6southafrica.com; Office Contact Number: 011 234 8399; Address: 258 Roan Crescent, Corporate Park North, Midrand, 1685', '2025-09-23'),
    ('AEC001', 'A&E Connock', NULL, 2, 'Available', 'A&E Connock is a UK-based supplier of specialty ingredients to the personal care industry worldwide since 1973. While they supply globally, the specific ''South African chemical supplier'' aspect was not prominently highlighted on their main website or product list, beyond a few South African origin ingredients like ''APRICOT STONE GROUND SOUTH AFRICAN'' and ''MARULA SEED OIL SOUTH AFRICAN''. Their product list is extensive, covering exfoliants, fluid extracts, vegetable oils, essential oils, and special cosmetic additives. Pricing information is not publicly available on their website. Technical support is implied through their sales department for samples and information. Strategic importance for the South African skincare supply chain would stem from their offering of South African origin ingredients and their global supply network, which could potentially serve South African manufacturers.', false, 'Medium', 'https://connock.co.uk/', 232, false, 'Roman Chamomile Oil English, Olive Squalane, Niacinamide, Silicone Alternatives (GEL (LV-1), GEL (MV-1), HV-1, HV-2, LV-1, LV-2, MV-1)', 'Not specified in the document.', 'Available via sales department for information and samples.', 'Not explicitly stated on the website, but some search results mention HACCP, FDA, and Kosher certifications for some products. Further investigation would be needed for a comprehensive list.', 'Low', 'Phone: +44 (0)1425 653367, Email: sales@connock.com', '2025-09-23'),
    ('AKU001', 'AECI', NULL, 3, 'Available', 'AECI Specialty Chemicals is a leading South African manufacturer and distributor of application-specific performance chemicals, including a range of personal care ingredients. Their website lists product categories like Actives, Chelating Agents, Emollients and Humectants, Preservatives, and Surfactants. Detailed product information, including Safety Data Sheets (SDSs) and Certificates of Analysis (COAs), is available by scanning QR codes on product labels, indicating a digital approach to technical documentation. Pricing information is not publicly available and would require direct contact. They emphasize a commitment to green chemistry, sustainability, and customer-centricity, with a personal care applications lab for product development and testing. They are winners of the 2022 Responsible Care Initiative of the Year award (CAIA) and signatories of the responsible care pledge. The exact number of skincare ingredients is not quantifiable from the public website without access to their full product database via the QR code system.', false, 'High', 'https://sc.aecichemicals.co.za/', 0, false, 'New products are introduced regularly, with technical information accessible via QR codes on revamped product labels. Specific new skincare ingredients not detailed on public site.', 'Not explicitly stated on the public website. Requires direct inquiry or access to product labels.', 'High (Offers a personal care applications lab for formulation, testing, troubleshooting, stability testing, and raw material retesting. Technical information (SDS, COA) accessible online via QR codes.)', 'Responsible Care Initiative of the Year award (CAIA) 2022, Signatories of the Responsible Care Pledge. Specific product certifications (SDS, COA) available via QR code on product labels.', 'Low', 'AECI Specialty Chemicals: T +27 11 922 1600, E specialtychemicals@aeciworld.com', '2025-09-23'),
    ('BOT0003', 'Botanichem', NULL, 4, 'Available', 'Botanichem is a South African-based supplier of plant-derived ingredients and raw materials to the cosmetics industry. They act as a full-service agency and have partnerships with several global chemical companies, including BASF Care Creations, Cobiosa, Zuplex, Sunjin, Kupanda, JAKA, and Organic Bioactives. Their online shop, hosted by ''The Personal Care Coach and Training Company'', lists approximately 162 skincare ingredients with clear pricing. While direct pricing for BASF products through Botanichem isn''t explicitly detailed, the online shop provides transparent pricing for many other ingredients. Technical support appears to be available through ''The Personal Care Coach and Training Company'' for formulation and training. Certifications are not explicitly listed on the product pages, but their commitment to sustainable, organic, and safe products suggests adherence to quality standards. Further investigation would be needed to confirm specific certifications for all products and to identify new or discontinued items from their entire catalog.', false, 'High', 'https://botanichem.co.za/', 162, true, 'Not explicitly stated, but regular updates to the online shop suggest new products are added.', 'Not explicitly stated.', 'Available through ''The Personal Care Coach and Training Company'' for formulation and training.', 'Not explicitly stated, but focus on plant-derived, organic and safe products implies certain standards. BASF Care Creations products may have their own certifications.', 'Low', 'Email: info@botanichem.co.za, Tel: 011 425 2206', '2025-09-23'),
    ('CAR0002', 'Carst&Walker div of Zenith Ho', NULL, 5, 'Available', 'Carst & Walker is a multinational distributor with a strong presence in South Africa, representing major global manufacturers. Their extensive product portfolio, technical expertise, and established logistics network make them a critical supplier for the South African skincare industry. The introduction of new, innovative ingredients like PhytoCellTec™ Malus Domestica further enhances their strategic value. As a multinational distributor with a wide network of offices and warehousing facilities, Carst & Walker likely has a robust and diversified supply chain, mitigating some risks. However, reliance on exclusive representation of major multinational companies could introduce some dependency risks if those relationships change. The global nature of their sourcing could also expose them to international supply chain disruptions, though their extensive network should help buffer against this. Overall, their established infrastructure and diverse product range suggest a relatively stable supply chain.', false, 'High', 'https://carst.com/', 30, false, 'PhytoCellTec™ Malus Domestica (plant stem cell cosmetic ingredient for anti-ageing, available in South Africa)', 'None explicitly mentioned.', 'The website states, "Our team of SOLUTIONATORS is on standby to assist in the procurement of, advice on and solutions to your requirements relating to the... Consumer Specialities... sectors." This indicates a good level of technical support and expertise.', 'BSI ISO 9001, Proud to be a Sedex Member, UFAS (Universal Feed Assurance Scheme), FEMAS (Feed Materials Assurance Scheme)', 'Low to Medium', 'The website provides a contact form. No direct email or phone number is listed on the ''Contact Us'' page, but the home page mentions a South Africa phone number: +27 114893600 (from search results).', '2025-09-23'),
    ('CHE0004', 'Chempure (Pty) Ltd', NULL, 6, 'Available', 'Chempure (Pty) Ltd is a South African chemical supplier specializing in innovative ingredients for various industries, including personal care. Their website provides a comprehensive list of skincare ingredients categorized by function (Acids, Anti-Pollution, Antioxidant, CBD, Even Skin Tone & Glow, Exfoliators, Hydrocolloids, Lines & Wrinkles Refinement, Luminosity & Brightening, Sebum, Blemish & Oil Control, Skin Aging Prevention & Rejuvenation, Skin Sensitivity & Comfort Recovery, Stress Reduction, Vita Specialties). They emphasize quality and technical support from their principal suppliers. Pricing information is not publicly available on the website. One product, RED ALGA GEL, is noted as ''retired''.', false, 'High', 'https://chempure.co.za/', 136, false, 'Not explicitly highlighted as ''new'' products, but the catalog is extensive and regularly updated based on industry trends.', 'RED ALGA GEL (Algae extract) is listed as (retired)', 'Excellent application and technical support (as stated on their ''Our Ingredients'' page)', 'Not explicitly stated on the website, but they mention "rigorously tested for consistent, highest quality" and represent "multi-national, world-class principal suppliers."', 'Low (Implied by representing ''multi-national, world-class principal suppliers'' and providing ''excellent service in the supply chain'')', 'Tel: 012 349-1543/4/5/6, queries@chempure.co.za', '2025-09-23'),
    ('CJP0001', 'CJP Chemicals (Pty) Ltd', NULL, 7, 'Available', 'CJP Chemicals is a leading stockist and supplier of raw materials and ingredients in Southern Africa, serving various industries including Personal Care. They emphasize innovation, excellence, and strong supply chain partnerships. Their commitment to sustainability is evidenced by their RSPO membership. Pricing is available upon request through a quote system. Technical support is implied through their stated ''technical competence'' and ''value added services''.', false, 'High (due to market leadership, broad product range, and commitment to sustainability)', 'https://www.cjpchemicals.co.za/', 428, false, 'Not specified in data', 'Not specified in data', 'Available (implied through ''technical competence'' and ''value added services'', details upon contact)', 'BBBEE Level 4, RSPO (Roundtable on Sustainable Palm Oil) member since 2019', 'Low (due to extensive distribution network, focus on supply chain partnerships, and RSPO membership for sustainable sourcing)', 'Telephone: +27 11 494 6700, Fax: +27 11 494 6701, Email: info@cjpchemicals.co.za, Physical Address: 60 Electron Avenue, Isando, 1600, Johannesburg, South Africa, Postal Address: P. O. Box 1353, Cresta 2118, Johannesburg, South Africa', '2025-09-23'),
    ('CLI0001', 'Clive Teubes CC / Scatters Oils', NULL, 8, 'Available', 'Clive Teubes CC / Scatters Oils is a South African supplier of essential oils and natural extracts. They offer a wide range of products, including over 50 varieties of essential oils and several isolates. The company emphasizes quality, social upliftment through community projects, and global export. They provide technical support for rural production facilities. Pricing information is not publicly available on the website; a product brochure needs to be requested via email. The company holds ISO 22000, Halaal, Kosher, and HACCP certifications. Their products are relevant for skincare due to the nature of essential oils and natural extracts.', false, 'High', 'https://www.teubes.com/', 64, false, 'None explicitly identified, but continuous research and development is mentioned.', 'None identified', 'Technical support provided for rural production facilities and general product inquiries can be directed to their contact email.', 'ISO 22000, Halaal Certification, Kosher Certification, HACCP Certification', 'Low', 'Physical Address: 75 Wakis Avenue, Strydom Park, Randburg, South Africa; Postal Address: PO Box 4919, Randburg 2125, South Africa; Telephone: +27 11 792 4451, +27 11 792 4452; Fax: +27 11 792 1110; Email: deliwe@teubes.com', '2025-09-23'),
    ('COS0007', 'Cosmetic Ingredients (Pty) Ltd', NULL, 9, 'Available', 'Cosmetic Ingredients (Pty) Ltd is a business-to-business supplier of specialty and claims ingredients to the southern African cosmetic and personal care manufacturers. They distribute ingredients from various international manufacturers. Their product range includes ingredients for skin, hair and scalp, colour cosmetics and sunscreens. They emphasize technical and commercial support from their supply partners. They do not supply product lists or quotes without specific ingredient tradenames. Their key suppliers include Kobo Products (powder and dispersion specialist, suncare, color dispersions, natural ingredients), Seiwa Kasei (plant and vegetable protein derivatives, glycerol ascorbic acid derivatives, encapsulated organic sunscreens), AQIA Quimica Inovativa (hair and skin care actives, natural and vegan-friendly ingredients), Contipro (hyaluronic acid, anti-ageing actives like peptides), Aldivia (natural oils, butters, waxes, anti-ageing actives), Assessa (green and high-efficiency bioactive ingredients, natural and marine-derived ingredients), Ethox Chemicals (moisturisers, surfactants, emollients), Stephenson Personal Care (soap-based products, emulsifiers, solubilisers), Ellamera (polymers for texture, viscosity, water-repellency), Oat Cosmetics (oat-based ingredients), and Selco-GfN (active ingredients and plant extracts). The website is well-structured and provides links to their suppliers'' websites for detailed product information. Contipro and Aldivia websites had some navigation issues or were under maintenance during the research.', false, 'High', 'https://cosmetic-ingredients.co.za/', 50, false, 'Kobo Products lists "CCC65GZSG - Natural-Origin Zinc Oxide Dispersion" and "Rejuvenating 800 Da HA – Low molecular weight (800 Da) sodium hyaluronate" as new products. Assessa has "FLOWER POWER HIBISCUS" and "HYPSKIN" as new products.', 'Not explicitly mentioned on the website or supplier websites.', 'Cosmetic Ingredients (Pty) Ltd offers technical and commercial support, and uses their applications laboratory to create guideline formulations and assist with product development. Their international principals also provide technical and commercial support. Contipro also emphasizes top-level technical support.', 'Many ingredients are COSMOS / Eco-Certified or vegan. Kobo Products has some COSMOS approved raw materials. Assessa has natural and marine-derived ingredients, many with Eco-certification.', 'Low', 'Physical Address: Hennopspark, Centurion; Work Hours: Monday to Friday: 8:30 - 16:30; Email Address: info@cosmetic-ingredients.co.za; Phone Number: +27 12 653 3376', '2025-09-23'),
    ('CRO0001', 'Croda Chemicals S.A (Pty) Ltd', NULL, 10, 'Available', 'Croda Beauty offers a wide range of skincare ingredients (630 products identified). The company emphasizes its commitment to continuous improvement and adherence to various global and local standards and certifications, including ISO, GMP, USDA Biopreferred, Vegan-suitable, Halal, COSMOS, and RSPO Mass Balance. This indicates a strong focus on quality, sustainability, and ethical sourcing, which are positive indicators for strategic importance. Technical support is extensive, but pricing and specific discontinued product information are not publicly available on the website.', false, 'High', 'https://www.crodabeauty.com/en-gb', 630, false, 'Zenakine™, Moist 24™ (examples from search results)', 'No explicit list found; likely available through direct inquiry or product-specific data sheets.', 'Extensive technical support through a ''Contact Us'' form, ''Live Chat'', and a ''Technical Library'' with downloadable product guides, technical data sheets, and presentations.', 'ISO 9001, ISO 14001, EFfCI GMP, USDA Biopreferred Program, Vegan-suitable, Halal, COSMOS, RSPO Mass Balance.', 'Medium', 'Contact Us form, Live Chat, Technical Library', '2025-09-23'),
    ('CTE0001', 'Chemgrit Cosmetics (C-Tec)', NULL, 11, 'Available', 'Chemgrit Cosmetics (C-Tec) has been acquired by Brenntag Specialties and its operations are integrated into Brenntag South Africa''s Beauty & Personal Care business unit. Brenntag offers a wide range of high-quality ingredients for cosmetics and personal care, including many relevant for skincare. They emphasize innovation, sustainability, safety, and technical support through their global Innovation & Application Centers. Pricing information is not publicly available and requires direct contact. They hold EcoVadis Gold status for sustainability and are recognized as a Top 10 Supplier by SpecialChem.', false, 'High', 'https://www.brenntag.com/en-za/industries/beauty-and-personal-care/', 30, false, 'Brenntag offers a comprehensive portfolio including ''Actives'', ''Botanical extracts'', ''Butters'', ''Chelating agents'', ''Color effects'', ''Colorants and pigments'', ''Conditioners'', ''Elastomers'', ''Emollients and emulsifiers'', ''Essential oils'', ''Esters'', ''Exfoliants'', ''Fatty alcohols, fatty acids and esters'', ''Film formers'', ''Fragrances and perfume ingredients'', ''Innovative active ingredients'', ''Mild surfactants, bio-surfactants and blends'', ''Natural oils'', ''Optical brighteners'', ''Performance polymers'', ''Pigments'', ''Preservatives'', ''Rheology modifiers'', ''Silicones'', ''Skincare products sun care and complementary products (e.g biopolymers, SPF boosters)'', ''Solubilizers'', ''Surfactants'', ''UV filters'', ''Vitamins and liposomes'', ''Waxes'', and own branded products like CosVivet, Kenapure, Primesurf.', 'Not explicitly mentioned, but Chemgrit Cosmetics'' independent operations have been integrated into Brenntag.', 'Extensive technical support, formulation assistance, regulatory support, and performance testing offered through 16 state-of-the-art Beauty & Personal Care Innovation & Application Centers globally.', 'EcoVadis Gold status (Brenntag), Top 10 Suppliers for Beauty & Personal Care by SpecialChem (Brenntag)', 'Low (due to Brenntag''s global leadership and robust supply chain management)', 'Contact via Brenntag South Africa website: https://www.brenntag.com/en-za/industries/beauty-and-personal-care/ (Contact form available on page)', '2025-09-23'),
    ('EVO0001', 'Protea Chemicals', NULL, 12, 'Unknown', 'Protea Chemicals is a major chemical distributor in South Africa, with a Consumer Care division that supplies raw materials for the personal care industry. However, their official website is currently inaccessible due to a security certificate issue, preventing a direct assessment of their product catalog. The available information from third-party sources and a product list for their mining division indicates a broad portfolio of chemicals, but a specific list of skincare ingredients could not be obtained. They are ISO certified and a signatory to the Responsible Care® programme, suggesting a commitment to quality and safety. Further investigation is required to determine their specific offerings for the skincare market.', true, 'Medium', 'https://proteachemicals.co.za/', 0, false, 'Unknown', 'Unknown', 'Offers technical support, formulation assistance, and application development.', 'ISO 9001, 14001 and 18001 certified. Signatory to the Responsible Care® programme.', 'Medium', 'Head office: Wadeville, South Africa +27 (0) 11 323 3000, Email: info@proteamining.co.za', '2025-09-23'),
    ('HEX0001', 'Orkila', NULL, 13, 'Available', 'Orkila was acquired by Azelis in 2019 and is now fully integrated. All information regarding products, services, and contacts for Orkila is now found on the Azelis corporate website. Azelis offers a comprehensive range of skincare ingredients under their Personal Care market segment, including various active ingredients, emollients, and preservatives. They provide strong technical support through application laboratories, sampling services, and expert advice. Certifications include REACH compliance and adherence to local quality systems. Pricing information is not publicly available and requires direct contact. Azelis has a strong presence in South Africa and continues to strengthen its footprint through further acquisitions, indicating a high strategic priority for the region.', false, 'High', 'https://www.azelis.com', 15, false, 'Not explicitly mentioned, but Azelis continuously innovates and offers new formulations.', 'None explicitly mentioned as discontinued, but Orkila''s separate operations are integrated into Azelis.', 'High (Application laboratories, sampling service centers, expert advice, formulation development, problem-solving, knowledge-based advice, marketing team for research trends and new product opportunities)', 'REACH compliant, regularly audited facilities compliant to highest local quality systems, active in Responsible Care or Responsible Distribution principles.', 'Low', 'Colleen Maroun, Business Manager, T: +27 83 785 0998, E: Colleen.maroun@azelis.co.za', '2025-09-23'),
    ('LIP0001', 'Vantage Speciality Chemicals', NULL, 14, 'Available', 'Vantage Speciality Chemicals offers a wide range of personal care and beauty ingredients. They have a physical presence in South Africa. Pricing information is not publicly available on their website. Technical support is indicated through dedicated sections and contact forms.', false, 'Medium', 'https://www.vantagegrp.com/', 315, false, 'Not explicitly stated on the website.', 'Not explicitly stated on the website.', 'Available through product-specific requests and general inquiry forms.', 'China Compliant, COSMOS, Ecocert, Halal, ISO 16128, Kosher, NATRUE, Organic, RSPO, Vegan', 'Low', '170 Roan Crescent, Corporate Park North Midrand 1685, South Africa; Tel: +27 11 314 0912', '2025-09-23'),
    ('Maccullum', 'Exsymol', NULL, 15, 'Available', 'Exsymol, a Monaco-based company, is a designer and manufacturer of active ingredients for cosmetics, specializing in organic silicium (Silanols), peptides, and natural extracts. Their products are distributed in South Africa by Biosil Technologies. The product catalog from Biosil Technologies includes a range of Exsymol actives such as ADENOSILANE (anti-aging, pore reduction), ASCORBOSILANE® (antioxidant, collagen synthesis, skin lightening), ASTRASINOL (anti-inflammatory, moisturizer), EPIDERMOSIL (anti-wrinkle, moisturizers), and others with various skin benefits. Technical information is provided for each ingredient, including INCI names and ingredient functions. Pricing information is not publicly available. Exsymol holds EcoVadis GOLD certification for its CSR policy. Biosil Technologies also distributes other ingredient types, indicating a broader portfolio beyond Exsymol''s offerings. The strategic importance of Exsymol, through Biosil Technologies, is high due to their specialized and innovative active ingredients, particularly silanols, which align with advanced skincare formulations. Their focus on scientifically backed ingredients and sustainability (Exsymol''s EcoVadis certification) makes them a valuable supplier for the SKIN-TWIN network.', false, 'High', 'https://www.exsymol.com/en/ (Exsymol), https://www.biosiltech.com/ (Biosil Technologies)', 12, false, 'None explicitly identified as new, but the Biosil Technologies website has a ''New Ingredients'' section which could be explored further.', 'None explicitly identified.', 'Detailed technical information available on product pages, suggesting good technical support through the distributor.', 'Not explicitly stated for Biosil Technologies, but Exsymol has EcoVadis GOLD certification.', 'Medium (due to international supplier with local distributor, potential for import/logistics challenges, but established distribution network mitigates some risk)', 'Biosil Technologies South Africa: Tel: +27 (0)11 314 0912, Fax: +27 (0)11 314 0912. Email: customerservice@exsymol.com (for Exsymol directly)', '2025-09-23'),
    ('MAT0002', 'Materia Medica', NULL, 16, 'Available', 'Materia Medica (Pty) Ltd. is a South African company that imports and markets specialized botanical actives to the cosmetic industry. They offer technical expertise and formulatory assistance. Their website does not feature a detailed product catalog, pricing information, or specific certifications. Further direct contact would be required to obtain a comprehensive list of skincare ingredients, their availability, pricing, and certifications. The company emphasizes its technical expertise in selecting suitable actives and assisting with product development.', false, 'Medium', 'http://www.materiamedica.co.za/cosmetic/', 0, false, 'Not specified on website.', 'Not specified on website.', 'Offers technical expertise and formulatory assistance for cosmetic product development.', 'Not explicitly stated on website; further inquiry needed.', 'Unknown (due to lack of detailed product and operational information)', 'Phone: +27 72 731 3909, Fax: +27 86 243 4777, E-mail: chantal@materiamedica.co.za', '2025-09-23'),
    ('MEG0001', 'Meganede CC', NULL, 17, 'Available', 'Meganede CC is a South African distributor for various international suppliers, including Silab. They specialize in naturally derived active ingredients for the cosmetic industry. Their website lists several categories of ingredients they specialize in, such as actives, emulsifiers, preservatives, emollients, sunscreen agents, chelating agents, scrubs, conditioning agents, anti-oxidants, and prebiotics. Pricing information is not available on their website. Technical support is implied through their expertise and focus on high-quality ingredients and service. Strategic priority is high due to their role as a distributor for multiple international suppliers in the South African market, offering a diverse range of specialized ingredients. Supply chain risk appears low given their established presence since 2007 and partnerships with reputable international suppliers.', false, 'High', 'https://www.meganede.com/', 16, false, 'Not explicitly mentioned on the website for Meganede CC. Silab''s news section mentions product innovations like LIFTILIENCE® and NEOLIPYL®.', 'Not explicitly mentioned on the website.', 'Implied through their expertise and focus on high-quality ingredients and service.', 'Meganede CC distributes products from suppliers like Silab, which has various certifications (e.g., EcoVadis Platinum status mentioned on Silab''s news page). Specific certifications for Meganede CC itself are not explicitly stated on their website.', 'Low', 'Email: info@meganede.com, Phone: +27 66 448 2860, +27 73 513 5984, Location: Bedfordview, Johannesburg', '2025-09-23'),
    ('MER0001', 'Merck (Pty) Ltd', NULL, 18, 'Unknown', 'Merck KGaA, the parent company, has divested its Surface Solutions business, which included cosmetic pigments and the RonaCare line of beauty and personal care ingredients, to Global New Material International Holdings (GNMI). The RonaCare brand is now under Susonity. Therefore, Merck (Pty) Ltd in South Africa is likely a distributor or no longer directly involved in the manufacturing/supply of these specific skincare ingredients. The identified RonaCare products are: RonaCare® Cyclopeptide-5 alcoholfree, RonaCare® RenouMer COS, RonaCare® Di-Sodium Hydrogen Phosphate, RonaCare® Salicylic Acid extra pure, and RonaCare® Aluminium Chloride Hydroxide-Allantoin. Pricing and direct availability require sign-up/login on the Susonity website. Technical support is available through Susonity. Strategic importance as a direct supplier of skincare ingredients is likely low due to divestment. Supply chain risk is medium due to potential indirect relationship.', true, 'Low', 'https://www.merckgroup.com/en/worldwide/merck-in-south-africa.html', 5, false, 'RonaCare Baobab, RonaCare Hibiscus, RonaCare JouvaMer, RonaCare ReviMer (launched by Merck parent company in 2022, now under Susonity/GNMI)', 'No specific discontinued skincare ingredients were explicitly found, but the divestment of the entire Surface Solutions business implies a significant shift in Merck''s direct involvement in this sector.', 'Documentation (Certificate of Analysis, Product Specification, Safety Data Sheet, Technical Data Sheet) is available through Susonity. Direct technical support from Merck (Pty) Ltd for these specific cosmetic ingredients post-divestment is unclear.', 'Halal, vegan, ISO 16128 (100% NOC), COSMOS, NATRUE (associated with RonaCare products under Susonity)', 'Medium', 'Address: 1, Friesland Drive, Longmeadow Business Estate, Modderfontein, 1645, South Africa; Phone: +27 11 372 5000, 0860063725; Email: merck4sme@merckgroup.com', '2025-09-23'),
    ('MIL0001', 'Millchem', NULL, 19, 'Available', 'Millchem (Pty) Ltd is a market leader in South Africa, distributing a broad range of specialty ingredients for personal care, cosmetics, home care, and institutional product development. They represent major international suppliers like Ashland, Elementis, Micro Powders, and Esperis, offering diverse ingredients including bio-functional actives, rheology modifiers, natural clays, exfoliants, and sun care solutions. Their technical capabilities include blending facilities and R&D laboratories in Johannesburg and Cape Town. They provide comprehensive service, technical advice, warehousing, and distribution. While no specific pricing information is publicly available, their established infrastructure and partnerships suggest a reliable supply chain. No explicit certifications were found, but quality control is mentioned. The product count is difficult to ascertain precisely without direct access to their full catalog, but it is extensive given the number of represented companies and product categories.', false, 'High', 'https://millchem.co.za/', 0, false, 'New product developments are highlighted by some represented companies (e.g., Ashland, Micro Powders, Esperis), but specific new products available through Millchem in South Africa were not explicitly listed.', 'Not specifically identified for Millchem or its represented skincare ingredient suppliers.', 'Comprehensive service, technical advice, warehousing, and distribution', 'Not explicitly stated on the website, but they have laboratories for quality control and product development.', 'Low (due to established infrastructure, multiple locations, and long-standing supplier relationships, despite general South African supply chain challenges)', 'Phone: +27 (0)11 974 2255, +27 (0)21 557 6527; Postal Address: PO Box 8595, Edenglen, 1613; Physical Address: 90 Newton Road, Meadowdale, 1600', '2025-09-23'),
    ('NAT0001', 'Natchem CC', NULL, 20, 'Unknown', 'Natchem CC is a key distributor for Greentech botanicals and Payan Bertrand fragrances in South Africa. While their website lacks a detailed public catalog for skincare ingredients and pricing, they offer strong customer support and are BEE certified. The Greentech product list provides a comprehensive overview of potential skincare ingredients available through Natchem CC, though specific availability and pricing require direct inquiry. Their responsiveness to customer demand for discontinued products suggests a flexible approach to their offerings.', true, 'High', NULL, 60, false, 'New product arrivals are communicated via social media and the website, primarily focusing on fragrances. Specific new skincare ingredients are not explicitly listed publicly.', 'Natchem CC has revived some discontinued fragrance oils due to popular demand, indicating a dynamic product portfolio.', 'Good level of technical support through a dedicated sales team and various representatives, emphasizing customer relationships and product suitability.', 'BEE (Black Economic Empowerment) certified.', 'Medium', 'Telephone: 010 010 6174, WhatsApp: +27 82 331 4508, Email for orders: online@natchem.co.za', '2025-09-23'),
    ('ORC0001', 'Orchem', NULL, 21, 'Available', 'Orchem is a South African chemical supplier and a member of the REDA Chemicals Group. They are a distributor for Evonik''s personal care portfolio in South Africa. A detailed product catalog for skincare ingredients is not publicly available on Orchem''s or REDA Chemicals'' websites. Evonik''s website provides extensive information on their personal care ingredients and formulations, but it is not possible to determine which of these are distributed by Orchem in South Africa without direct contact. It is recommended to contact Orchem directly to inquire about their skincare ingredient portfolio.', false, 'Medium', 'https://orchem.co.za/', 0, false, 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Medium', 'Johannesburg Office: Tel: +27 11 465 6353, management@orchem.co.za; Durban Office: Tel: +27 31 100 80 40, management@orchem.co.za', '2025-09-23'),
    ('SAV0001', 'Savannah Fine Chem (Pty) Ltd', NULL, 22, 'Available', 'Savannah Fine Chem (Pty) Ltd is a well-established South African distributor of fine chemicals, including a comprehensive range of personal care ingredients. They emphasize quality, integrity, and strong supplier relationships. They hold multiple certifications (ISO 9001:2015, FSSC 22000 v6, FSSC 24000 v1) demonstrating a commitment to quality and safety. The website lists a broad spectrum of skincare ingredients, from basic to specialty actives. Pricing information is not publicly available and requires direct inquiry. They appear to be strategically important due to their extensive product range, multiple branches, and focus on technical support and product development. Supply chain risk appears low due to their established logistics and controlled supply chains. The news section highlights new product introductions like Clarivine™.', false, 'High', 'https://savannah.co.za/', 25, false, 'Clarivine™ (new active ingredient from Vytrus Biotech mentioned in news section)', 'Not specified on the website.', 'High (emphasized through ''cutting edge technology with sensory expertise'' and ''global winners providing technical support'')', 'ISO 9001:2015, FSSC 22000 v6, FSSC 24000 v1', 'Low', 'Johannesburg: Tel: +27 11 856 4500, Email: info@savannah.co.za, Office: 19 Boeing Road West, Morninghill, Bedfordview, 2007, Warehouse: 19 Steele Street, Steeledale, JHB; Cape Town: Tel: +27 21 830 5306, Email: info@savannah.co.za, Office: Spaces Century City, No 1 Bridgeway Road, Bridgeways Precinct, Century City, Cape Town, 7441, Warehouse: 5-7 Ipswitch Street, Hagley, Kuilsriver, Cape Town; Durban: Tel: +27 31 313 3338, Email: info@savannah.co.za, Office: Connect Space Musgrave, 2nd Floor 102 Stephen Dlamini Road, Durban 4001, Warehouse: 57 Joyner Road, Joggie Vermooten Park, Prospecton, Durban, Warehouse Tel: +27 31 940 3010', '2025-09-23'),
    ('SIY0002', 'IMCD South Africa (Pty) Ltd', NULL, 23, 'Available', 'IMCD South Africa (Pty) Ltd is a leading global distributor of specialty chemicals and ingredients. Their South African website provides a partial catalog of skincare ingredients, with a total of 194 results indicated. Full product portfolio and pricing information require login to MyIMCD. They have a ''Beauty Studio'' in Johannesburg for product development and technical support. Certifications include ISO 9001:2015 and BEE Level 6. The company appears to be a significant player in the South African specialty chemicals and ingredients market, including skincare.', false, 'High', 'https://www.imcdsa.co.za/', 194, false, 'Not explicitly identified on public pages.', 'Not explicitly identified on public pages.', 'Comprehensive technical support through a global network of 80+ technical centers, including a ''Beauty Studio'' in Johannesburg for product development and formulation assistance. Support team available via contact form.', 'ISO 9001:2015 (valid until 21-07-2026), BEE verification certificate - Level 6 Contributor (60% Procurement Recognition Level). Individual products may have Halal, COSMOS, non-GMO, RSPO, etc. certifications.', 'Low', 'Phone: +27 11 570 4260, +27 (0)11 293 2000. Address: 275 Oak Avenue, Ferndale, Randburg, 2194, South Africa. (Email via contact form on website)', '2025-09-23')
    ON CONFLICT DO NOTHING;
  

