-- Supabase Schema for SKIN-TWIN Hypergraph
-- Generated on: 2025-09-23 08:47:12


    CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(20) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        timeset VARCHAR(50),
        modularity_class INTEGER,
        availability_status VARCHAR(50),
        research_notes TEXT,
        contact_required BOOLEAN,
        strategic_priority VARCHAR(20),
        website_url VARCHAR(500),
        product_count INTEGER DEFAULT 0,
        pricing_available BOOLEAN DEFAULT FALSE,
        new_products TEXT,
        discontinued_products TEXT,
        technical_support TEXT,
        certifications TEXT,
        supply_chain_risk VARCHAR(20),
        contact_info TEXT,
        last_updated DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    


    CREATE TABLE IF NOT EXISTS ingredients (
        id VARCHAR(20) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        timeset VARCHAR(50),
        modularity_class INTEGER,
        availability_status VARCHAR(50),
        research_notes TEXT,
        contact_required BOOLEAN,
        strategic_priority VARCHAR(20),
        supplier_id VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
    


    CREATE TABLE IF NOT EXISTS supplier_edges (
        id SERIAL PRIMARY KEY,
        source VARCHAR(20) NOT NULL,
        target VARCHAR(20) NOT NULL,
        type VARCHAR(50) DEFAULT 'Directed',
        label VARCHAR(255),
        timeset VARCHAR(50),
        weight INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (source) REFERENCES ingredients(id),
        FOREIGN KEY (target) REFERENCES suppliers(id)
    );
    


    CREATE TABLE IF NOT EXISTS supplier_capabilities (
        id SERIAL PRIMARY KEY,
        supplier_id VARCHAR(20) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        ingredients_count INTEGER DEFAULT 0,
        availability_confirmed VARCHAR(50),
        business_model VARCHAR(100),
        technical_support VARCHAR(50),
        innovation_focus VARCHAR(100),
        certifications TEXT,
        contact_info TEXT,
        strategic_priority VARCHAR(20),
        supply_chain_risk VARCHAR(20),
        cost_tier VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
    

