# Supabase Integration for SkinTwinFormX

This document provides instructions for integrating SkinTwinFormX with Supabase for database storage and authentication.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project with a name like "skintwinformx"
3. Note your project URL and API keys (anon key and service role key)

### 2. Set Up the Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Open the file `scripts/supabase-schema.sql` from this repository
3. Execute the SQL script in the SQL Editor to create all necessary tables and relationships
4. Optionally, run the sample data import function:
   ```sql
   SELECT skintwinformx.import_sample_data();
   ```

### 3. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
```

### 4. Synchronize Vessels Data

To synchronize data from the vessels directory with your Supabase database:

1. Ensure you have the correct environment variables set
2. Run the sync script:
   ```bash
   node scripts/sync-vessels-data.js --supabase
   ```

## Database Schema

The Supabase database uses a schema called `skintwinformx` with the following tables:

- `ingredients`: Stores ingredient information
- `formulations`: Stores formulation information
- `phases`: Stores phase information for formulations
- `ingredient_usage`: Maps ingredients to formulations with concentrations
- `suppliers`: Stores supplier information
- `products`: Stores product information
- And more related tables for comprehensive formulation management

## Row-Level Security (RLS)

The database is configured with Row-Level Security (RLS) policies that:

1. Allow authenticated users full access to all tables
2. Prevent public access to any data

## Hypergraph Integration

The database schema is designed to support hypergraph analysis as described in `vessels/HYPERGRAPH_INTEGRATION.md`. This enables:

- Network topology analysis
- Supply chain vulnerability assessment
- Formulation optimization
- Cross-layer connectivity analysis

## API Integration

The application connects to Supabase using:

1. The Supabase JavaScript client for frontend operations
2. Direct PostgreSQL connections for backend operations
3. The Supabase REST API for certain operations

## Authentication

Supabase handles authentication with the following features:

1. Email/password authentication
2. Magic link authentication
3. OAuth providers (optional)
4. Role-based access control

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Verify your environment variables are correctly set
2. Check that the schema was properly created in Supabase
3. Ensure your Supabase project has the necessary permissions
4. Check the application logs for specific error messages

## Updating the Schema

When making changes to the database schema:

1. Update the schema definition in `shared/schema.ts`
2. Create a new migration script in `drizzle/migrations/`
3. Update the Supabase schema by executing the migration SQL in the SQL Editor
4. Update the documentation to reflect the changes
