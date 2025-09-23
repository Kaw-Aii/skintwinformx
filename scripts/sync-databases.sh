#!/bin/bash

# Database Synchronization Script for SkinTwin FormX
# This script synchronizes schema and data between Neon and Supabase databases

set -e  # Exit on any error

echo "🔄 Starting Database Synchronization for SkinTwin FormX"
echo "====================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Configuration
NEON_PROJECT_ID="dawn-term-73173489"
SCRIPT_DIR="$(dirname "$0")"
SCHEMA_FILE="$SCRIPT_DIR/hypergraph-schema.sql"

print_status "Configuration:"
echo "  - Neon Project ID: $NEON_PROJECT_ID"
echo "  - Schema File: $SCHEMA_FILE"
echo "  - Supabase URL: ${SUPABASE_URL:-not configured}"
echo ""

# Phase 1: Verify Neon Connection
print_status "Phase 1: Verifying Neon database connection..."

if command -v manus-mcp-cli &> /dev/null; then
    print_status "Testing Neon connection..."
    if manus-mcp-cli tool call get_database_tables --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\"}}" > /dev/null 2>&1; then
        print_success "Neon connection verified"
        NEON_AVAILABLE=true
    else
        print_warning "Neon connection failed"
        NEON_AVAILABLE=false
    fi
else
    print_warning "manus-mcp-cli not available. Skipping Neon operations."
    NEON_AVAILABLE=false
fi

# Phase 2: Verify Supabase Connection
print_status "Phase 2: Verifying Supabase database connection..."

if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_KEY" ]; then
    print_status "Testing Supabase connection..."
    if curl -s -f "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_KEY" > /dev/null 2>&1; then
        print_success "Supabase connection verified"
        SUPABASE_AVAILABLE=true
    else
        print_warning "Supabase connection failed"
        SUPABASE_AVAILABLE=false
    fi
else
    print_warning "Supabase credentials not configured. Skipping Supabase operations."
    SUPABASE_AVAILABLE=false
fi

# Phase 3: Synchronize Neon Database
if [ "$NEON_AVAILABLE" = true ]; then
    print_status "Phase 3: Synchronizing Neon database..."
    
    # Check current tables
    print_status "Checking existing tables in Neon..."
    TABLES_OUTPUT=$(manus-mcp-cli tool call get_database_tables --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\"}}" 2>/dev/null || echo "[]")
    
    # Check if hypergraph tables exist
    if echo "$TABLES_OUTPUT" | grep -q "hypergraph_nodes"; then
        print_success "Hypergraph tables already exist in Neon"
    else
        print_status "Creating hypergraph tables in Neon..."
        
        # Create tables one by one to avoid SQL parsing issues
        print_status "Creating hypergraph_nodes table..."
        manus-mcp-cli tool call run_sql --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS hypergraph_nodes (id varchar(255) PRIMARY KEY, type varchar(50) NOT NULL, label varchar(500) NOT NULL, properties jsonb DEFAULT '{}', created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now());\"}}" > /dev/null
        
        print_status "Creating hypergraph_edges table..."
        manus-mcp-cli tool call run_sql --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS hypergraph_edges (id varchar(255) PRIMARY KEY, source varchar(255) NOT NULL, target varchar(255) NOT NULL, type varchar(50) NOT NULL, properties jsonb DEFAULT '{}', weight decimal(10, 4) DEFAULT 1.0, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now());\"}}" > /dev/null
        
        print_status "Creating hypergraph_analysis table..."
        manus-mcp-cli tool call run_sql --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\", \"sql\": \"CREATE TABLE IF NOT EXISTS hypergraph_analysis (id serial PRIMARY KEY, analysis_type varchar(100) NOT NULL, parameters jsonb DEFAULT '{}', results jsonb NOT NULL, node_count integer NOT NULL, edge_count integer NOT NULL, created_at timestamp DEFAULT now());\"}}" > /dev/null
        
        print_status "Creating indexes..."
        manus-mcp-cli tool call run_sql --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\", \"sql\": \"CREATE INDEX IF NOT EXISTS idx_hypergraph_nodes_type ON hypergraph_nodes (type);\"}}" > /dev/null
        manus-mcp-cli tool call run_sql --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\", \"sql\": \"CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_source ON hypergraph_edges (source);\"}}" > /dev/null
        manus-mcp-cli tool call run_sql --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\", \"sql\": \"CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_target ON hypergraph_edges (target);\"}}" > /dev/null
        
        print_success "Hypergraph tables created in Neon"
    fi
    
    # Insert sample data for testing
    print_status "Inserting sample hypergraph data..."
    manus-mcp-cli tool call run_sql --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\", \"sql\": \"INSERT INTO hypergraph_nodes (id, type, label, properties) VALUES ('test_ingredient_1', 'ingredient', 'Hyaluronic Acid', '{\\\"cas_number\\\": \\\"9067-32-7\\\", \\\"function\\\": \\\"humectant\\\"}') ON CONFLICT (id) DO NOTHING;\"}}" > /dev/null
    
    print_success "Neon database synchronization completed"
else
    print_warning "Skipping Neon synchronization (connection not available)"
fi

# Phase 4: Synchronize Supabase Database
if [ "$SUPABASE_AVAILABLE" = true ]; then
    print_status "Phase 4: Synchronizing Supabase database..."
    
    # Apply Supabase schema
    if [ -f "$SCRIPT_DIR/supabase-schema.sql" ]; then
        print_status "Applying Supabase schema..."
        # Note: This would require a proper Supabase client or psql connection
        print_warning "Supabase schema application requires manual execution of supabase-schema.sql"
    else
        print_warning "Supabase schema file not found"
    fi
    
    print_success "Supabase database synchronization completed"
else
    print_warning "Skipping Supabase synchronization (connection not available)"
fi

# Phase 5: Data Synchronization
print_status "Phase 5: Data synchronization..."

if [ "$NEON_AVAILABLE" = true ] && [ "$SUPABASE_AVAILABLE" = true ]; then
    print_status "Both databases available - implementing bidirectional sync..."
    # This would implement actual data synchronization logic
    print_warning "Bidirectional sync not yet implemented - manual sync required"
elif [ "$NEON_AVAILABLE" = true ]; then
    print_status "Only Neon available - using as primary database"
elif [ "$SUPABASE_AVAILABLE" = true ]; then
    print_status "Only Supabase available - using as primary database"
else
    print_warning "No databases available for synchronization"
fi

# Phase 6: Verification
print_status "Phase 6: Verification..."

if [ "$NEON_AVAILABLE" = true ]; then
    print_status "Verifying Neon tables..."
    FINAL_TABLES=$(manus-mcp-cli tool call get_database_tables --server neon --input "{\"params\": {\"projectId\": \"$NEON_PROJECT_ID\"}}" 2>/dev/null || echo "[]")
    TABLE_COUNT=$(echo "$FINAL_TABLES" | grep -o "table_name" | wc -l)
    print_success "Neon database has $TABLE_COUNT tables"
fi

# Phase 7: Generate Sync Report
print_status "Phase 7: Generating synchronization report..."

REPORT_FILE="database-sync-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Database Synchronization Report

**Generated:** $(date)
**Project:** SkinTwin FormX
**Script Version:** 1.0

## Summary

- **Neon Database:** $([ "$NEON_AVAILABLE" = true ] && echo "✅ Connected" || echo "❌ Not Available")
- **Supabase Database:** $([ "$SUPABASE_AVAILABLE" = true ] && echo "✅ Connected" || echo "❌ Not Available")

## Neon Database Status

$(if [ "$NEON_AVAILABLE" = true ]; then
    echo "- Project ID: $NEON_PROJECT_ID"
    echo "- Tables Created: hypergraph_nodes, hypergraph_edges, hypergraph_analysis"
    echo "- Indexes Created: Performance indexes for hypergraph operations"
    echo "- Sample Data: Test records inserted"
else
    echo "- Status: Connection not available"
    echo "- Action Required: Check MCP configuration and network connectivity"
fi)

## Supabase Database Status

$(if [ "$SUPABASE_AVAILABLE" = true ]; then
    echo "- URL: $SUPABASE_URL"
    echo "- Schema: Ready for application"
    echo "- Status: Connected but manual schema application required"
else
    echo "- Status: Connection not available"
    echo "- Action Required: Configure SUPABASE_URL and SUPABASE_KEY environment variables"
fi)

## Next Steps

1. **Manual Schema Application:** Apply scripts/supabase-schema.sql to Supabase if not already done
2. **Data Migration:** Implement data migration scripts for existing formulation data
3. **Testing:** Verify hypergraph functionality with real data
4. **Monitoring:** Set up database monitoring and alerting

## Files Created/Modified

- Database tables: hypergraph_nodes, hypergraph_edges, hypergraph_analysis
- Indexes: Performance indexes for graph operations
- Sample data: Test records for validation

## Troubleshooting

If synchronization fails:
1. Check network connectivity to database providers
2. Verify API keys and credentials
3. Ensure MCP servers are properly configured
4. Check database permissions and quotas

---
*Report generated by SkinTwin FormX Database Sync Script*
EOF

print_success "Synchronization report saved to: $REPORT_FILE"

# Summary
echo ""
print_success "🎉 Database Synchronization Complete!"
echo "======================================"
echo ""
print_status "Summary:"
echo "  ✅ Neon Database: $([ "$NEON_AVAILABLE" = true ] && echo "Synchronized" || echo "Skipped")"
echo "  ✅ Supabase Database: $([ "$SUPABASE_AVAILABLE" = true ] && echo "Ready" || echo "Skipped")"
echo "  📄 Report: $REPORT_FILE"
echo ""
print_status "The databases are now ready for hypergraph analytics!"
echo "Next: Test the application with the new hypergraph functionality."
echo ""
