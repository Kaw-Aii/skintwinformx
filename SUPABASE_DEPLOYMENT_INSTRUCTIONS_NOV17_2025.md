# Supabase Deployment Instructions
**Date:** November 17, 2025  
**Database:** Supabase PostgreSQL  
**Schema File:** `database_schemas/supabase_schema_enhanced.sql`

## Overview

This document provides instructions for deploying the enhanced Supabase schema with Row Level Security (RLS) policies and real-time support for the SkinTwin FormX application.

## Prerequisites

1. **Supabase Project**: Active Supabase project
2. **Environment Variables**: `SUPABASE_URL` and `SUPABASE_KEY` configured
3. **Database Access**: Admin access to Supabase SQL Editor

## Deployment Steps

### Step 1: Connect to Supabase

Using the Supabase Python client:

```python
from supabase import create_client
import os

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)
```

### Step 2: Deploy Schema via SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `database_schemas/supabase_schema_enhanced.sql`
3. Execute the SQL script

Alternatively, use the deployment script:

```bash
# Using Supabase CLI (if installed)
supabase db push

# Or execute SQL file directly
psql $DATABASE_URL -f database_schemas/supabase_schema_enhanced.sql
```

### Step 3: Verify Deployment

Check that all tables were created:

```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'formulations',
    'formulation_history',
    'hypergraph_edges',
    'hypergraph_nodes'
  )
ORDER BY table_name;
```

### Step 4: Verify RLS Policies

Check Row Level Security policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('formulations', 'formulation_history')
ORDER BY tablename, policyname;
```

### Step 5: Enable Real-time (Optional)

Enable real-time for specific tables:

```sql
-- Enable real-time for formulations table
ALTER PUBLICATION supabase_realtime ADD TABLE formulations;

-- Enable real-time for hypergraph updates
ALTER PUBLICATION supabase_realtime ADD TABLE hypergraph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE hypergraph_edges;
```

## Schema Overview

### Tables Created

1. **formulations**
   - Primary formulation data with user ownership
   - RLS policies for user-specific access
   - Real-time subscription support

2. **formulation_history**
   - Version tracking with foreign key to formulations
   - Cascade delete on formulation removal
   - RLS inherited from parent table

3. **hypergraph_edges**
   - Relationship edges between entities
   - Weight and properties support
   - Timestamp tracking

4. **hypergraph_nodes**
   - Entity nodes in the hypergraph
   - Type classification and labeling
   - JSONB properties for flexibility

### RLS Policies

**Formulations Table:**
- `Users can view their own formulations` (SELECT)
- `Users can insert their own formulations` (INSERT)
- `Users can update their own formulations` (UPDATE)
- `Users can delete their own formulations` (DELETE)

**Formulation History Table:**
- `Users can view their formulation history` (SELECT)
- `Users can insert their formulation history` (INSERT)

### Indexes

Performance indexes created on:
- `formulations.status`
- `formulations.created_at`
- `formulation_history.formulation_id`
- `formulation_history.changed_at`
- `hypergraph_edges.edge_type`
- `hypergraph_edges.source_id`
- `hypergraph_edges.target_id`
- `hypergraph_nodes.node_type`

## Data Loading

### Load Hypergraph Data

Use the Supabase client to load data:

```python
import json

# Load ingredients data
with open('database_schemas/ingredients_data.json') as f:
    ingredients = json.load(f)
    for ingredient in ingredients:
        supabase.table('hypergraph_nodes').insert(ingredient).execute()

# Load edges data
with open('database_schemas/edges_data.json') as f:
    edges = json.load(f)
    for edge in edges:
        supabase.table('hypergraph_edges').insert(edge).execute()
```

Or use the deployment script:

```bash
python3 scripts/load-supabase-data.py
```

## Testing

### Test RLS Policies

```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'test-user-id';

-- Should only see own formulations
SELECT * FROM formulations;

-- Reset role
RESET ROLE;
```

### Test Real-time Subscriptions

```javascript
const subscription = supabase
  .channel('formulations')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'formulations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## Troubleshooting

### RLS Policy Issues

If users can't access their data:

```sql
-- Check current user
SELECT current_user, auth.uid();

-- Temporarily disable RLS for testing
ALTER TABLE formulations DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
```

### Foreign Key Constraints

If data loading fails due to foreign keys:

```sql
-- Temporarily disable triggers
SET session_replication_role = replica;

-- Load data...

-- Re-enable triggers
SET session_replication_role = DEFAULT;
```

## Security Considerations

1. **API Keys**: Never expose `service_role` key in client-side code
2. **RLS Policies**: Always test policies thoroughly before production
3. **Data Validation**: Implement additional validation in application layer
4. **Audit Logging**: Enable Supabase audit logging for compliance

## Next Steps

1. ✓ Deploy schema to Supabase
2. ✓ Verify tables and RLS policies
3. ⏳ Load hypergraph data (228 records)
4. ⏳ Test real-time subscriptions
5. ⏳ Configure backup and monitoring

## Support

For issues with Supabase deployment:
- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/Kaw-Aii/skintwinformx/issues

---

**Deployment Status:** Ready for execution  
**Schema Version:** Enhanced (November 2025)  
**Data Files:** 4 files, 228 total records
