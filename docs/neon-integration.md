# Neon Integration for SkinTwinFormX

This document provides instructions for integrating SkinTwinFormX with Neon serverless PostgreSQL for database storage.

## Setup Instructions

### 1. Create a Neon Project

1. Go to [Neon](https://neon.tech/) and sign in or create an account
2. Create a new project with a name like "skintwinformx"
3. Note your project ID, branch ID, and connection string

### 2. Set Up the Database Schema

You can set up the database schema using one of the following methods:

#### Method 1: Using the Neon MCP

```bash
# Create the initial table
manus-mcp-cli tool call prepare_database_migration --server neon --input '{
  "params": {
    "projectId": "your-project-id",
    "migrationSql": "CREATE TABLE IF NOT EXISTS ingredients (id varchar(50) PRIMARY KEY NOT NULL, inci_name varchar(255) NOT NULL);"
  }
}'

# Verify the migration in the temporary branch
manus-mcp-cli tool call run_sql --server neon --input '{
  "params": {
    "projectId": "your-project-id",
    "branchId": "temporary-branch-id",
    "sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name = '\''ingredients'\''"
  }
}'

# Complete the migration
manus-mcp-cli tool call complete_database_migration --server neon --input '{
  "params": {
    "migrationId": "migration-id"
  }
}'
```

#### Method 2: Using the Neon SQL Editor

1. Navigate to the SQL Editor in your Neon dashboard
2. Open the file `scripts/neon-schema.sql` from this repository
3. Execute the SQL script in the SQL Editor to create all necessary tables and relationships
4. Optionally, run the sample data import function:
   ```sql
   SELECT import_sample_data();
   ```

### 3. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```
DATABASE_URL=postgresql://neondb_owner:password@ep-your-endpoint.aws.neon.tech/neondb?sslmode=require
NEON_PROJECT_ID=your-project-id
NEON_BRANCH_ID=your-branch-id
```

### 4. Synchronize Vessels Data

To synchronize data from the vessels directory with your Neon database:

1. Ensure you have the correct environment variables set
2. Run the sync script:
   ```bash
   node scripts/sync-vessels-data.js --neon
   ```

## Database Schema

The Neon database uses the following tables:

- `ingredients`: Stores ingredient information
- `formulations`: Stores formulation information
- `phases`: Stores phase information for formulations
- `ingredient_usage`: Maps ingredients to formulations with concentrations
- `suppliers`: Stores supplier information
- `products`: Stores product information
- And more related tables for comprehensive formulation management

## Hypergraph Integration

The database schema is designed to support hypergraph analysis as described in `vessels/HYPERGRAPH_INTEGRATION.md`. This enables:

- Network topology analysis
- Supply chain vulnerability assessment
- Formulation optimization
- Cross-layer connectivity analysis

## API Integration

The application connects to Neon using:

1. Direct PostgreSQL connections for backend operations
2. The Neon MCP for database management operations

## Branching Strategy

Neon provides branching capabilities that can be used for:

1. Development environments
2. Testing schema changes
3. Isolated feature development
4. A/B testing of database structures

## Troubleshooting

If you encounter issues with the Neon integration:

1. Verify your environment variables are correctly set
2. Check that the schema was properly created in Neon
3. Ensure your Neon project has the necessary permissions
4. Check the application logs for specific error messages

## Updating the Schema

When making changes to the database schema:

1. Update the schema definition in `shared/schema.ts`
2. Create a new migration script in `drizzle/migrations/`
3. Use the Neon MCP to apply the migration:
   ```bash
   manus-mcp-cli tool call prepare_database_migration --server neon --input '{
     "params": {
       "projectId": "your-project-id",
       "migrationSql": "ALTER TABLE ingredients ADD COLUMN new_column varchar(255);"
     }
   }'
   ```
4. Update the documentation to reflect the changes
