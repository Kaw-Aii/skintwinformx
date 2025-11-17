#!/usr/bin/env python3
"""
Deploy Neon Schema using MCP CLI
Deploys the skin_twin schema tables, indexes, and views to Neon database
"""

import json
import subprocess
import sys

PROJECT_ID = "damp-brook-31747632"

# SQL statements to execute in order
SQL_STATEMENTS = [
    # Table: formulation_history
    """CREATE TABLE IF NOT EXISTS skin_twin.formulation_history (
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
    )""",
    
    # Table: formulations
    """CREATE TABLE IF NOT EXISTS skin_twin.formulations (
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
    )""",
    
    # Table: hypergraph_edges
    """CREATE TABLE IF NOT EXISTS skin_twin.hypergraph_edges (
        id SERIAL PRIMARY KEY,
        edge_type VARCHAR(50) NOT NULL,
        source_id VARCHAR(50) NOT NULL,
        target_id VARCHAR(50) NOT NULL,
        weight DECIMAL(10, 4) DEFAULT 1.0,
        properties JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""",
    
    # Table: hypergraph_nodes
    """CREATE TABLE IF NOT EXISTS skin_twin.hypergraph_nodes (
        id VARCHAR(50) PRIMARY KEY,
        node_type VARCHAR(50) NOT NULL,
        label VARCHAR(255) NOT NULL,
        properties JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""",
    
    # Table: audit_log
    """CREATE TABLE IF NOT EXISTS skin_twin.audit_log (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        user_id VARCHAR(100),
        timestamp TIMESTAMP DEFAULT NOW(),
        changes JSONB,
        metadata JSONB
    )""",
]

INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_formulation_history_id ON skin_twin.formulation_history(formulation_id)",
    "CREATE INDEX IF NOT EXISTS idx_formulation_history_timestamp ON skin_twin.formulation_history(changed_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_formulation_history_type ON skin_twin.formulation_history(change_type)",
    "CREATE INDEX IF NOT EXISTS idx_formulations_status ON skin_twin.formulations(status)",
    "CREATE INDEX IF NOT EXISTS idx_formulations_created_at ON skin_twin.formulations(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_type ON skin_twin.hypergraph_edges(edge_type)",
    "CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_source ON skin_twin.hypergraph_edges(source_id)",
    "CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_target ON skin_twin.hypergraph_edges(target_id)",
    "CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_weight ON skin_twin.hypergraph_edges(weight DESC)",
    "CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_type ON skin_twin.hypergraph_nodes(node_type)",
    "CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_label ON skin_twin.hypergraph_nodes(label)",
    "CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON skin_twin.audit_log(entity_type, entity_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON skin_twin.audit_log(timestamp DESC)",
    "CREATE INDEX IF NOT EXISTS idx_audit_log_user ON skin_twin.audit_log(user_id)",
]

def run_mcp_command(sql_statements):
    """Execute SQL statements using MCP CLI"""
    input_data = {
        "params": {
            "projectId": PROJECT_ID,
            "sqlStatements": sql_statements
        }
    }
    
    cmd = [
        "manus-mcp-cli",
        "tool",
        "call",
        "run_sql_transaction",
        "--server",
        "neon",
        "--input",
        json.dumps(input_data)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✓ Executed {len(sql_statements)} statements successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error executing statements: {e.stderr}")
        return False

def main():
    print("=" * 60)
    print("Deploying Neon Schema: skin_twin")
    print("=" * 60)
    
    # Deploy tables
    print("\n[1/2] Creating tables...")
    if not run_mcp_command(SQL_STATEMENTS):
        print("Failed to create tables")
        sys.exit(1)
    
    # Deploy indexes
    print("\n[2/2] Creating indexes...")
    if not run_mcp_command(INDEXES):
        print("Failed to create indexes")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✓ Schema deployment completed successfully!")
    print("=" * 60)
    
    # Verify deployment
    print("\nVerifying deployment...")
    verify_cmd = [
        "manus-mcp-cli",
        "tool",
        "call",
        "run_sql",
        "--server",
        "neon",
        "--input",
        json.dumps({
            "params": {
                "projectId": PROJECT_ID,
                "sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'skin_twin' ORDER BY table_name"
            }
        })
    ]
    
    subprocess.run(verify_cmd)

if __name__ == "__main__":
    main()
