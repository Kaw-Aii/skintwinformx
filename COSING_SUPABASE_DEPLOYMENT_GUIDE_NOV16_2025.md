# COSING Supabase Deployment Guide
**Date:** November 16, 2025  
**Repository:** Kaw-Aii/skintwinformx  
**Task:** Deploy COSING schema and data to Supabase PostgreSQL

## Executive Summary

This guide provides complete instructions for deploying the COSING (COSmetic INGredient) database to Supabase, including schema creation and data import for all 30,070 cosmetic ingredients. The deployment process mirrors the successful Neon deployment completed on November 16, 2025.

## Current Status

### Neon PostgreSQL Deployment
✅ **COMPLETE** - Successfully deployed on November 16, 2025
- Database: skin-zone-hypergraph (damp-brook-31747632)
- Records: 30,070 ingredients
- Schema: Complete with indexes, views, and functions
- Status: Fully operational

### Supabase Deployment
📋 **PENDING** - Awaiting active Supabase instance
- Instance Status: Currently inaccessible
- URL: https://oziqpywbmripkxfywmdt.supabase.co
- Next Steps: Verify instance status or create new project

## Prerequisites

### Required Access

1. **Supabase Dashboard Access**
   - URL: https://supabase.com/dashboard
   - Account with project creation permissions
   - Access to SQL Editor

2. **Service Role Key** (for programmatic deployment)
   - Available in: Project Settings → API
   - Required for: Direct SQL execution
   - Alternative: Use SQL Editor in dashboard

3. **Database Connection String** (optional)
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`
   - Available in: Project Settings → Database
   - Use for: Direct psql connection

### Required Files

1. **Schema File**
   - Location: `database_schemas/cosing_ingredients_schema.sql`
   - Size: ~15 KB
   - Contains: Tables, indexes, views, functions, triggers

2. **Data Files**
   - CSV: `vessels/cosing/cosing_ingredients.csv` (5.9 MB)
   - JSON: `vessels/cosing/cosing_ingredients.json` (12.53 MB)
   - Compressed: `.gz` versions available

3. **Import Scripts**
   - Python: `import_cosing_to_supabase.py`
   - Batch preparation: `import_cosing_to_neon.py` (reusable)

## Deployment Methods

### Method 1: Supabase Dashboard (Recommended)

**Advantages:**
- No additional tools required
- Visual interface
- Built-in error checking
- Immediate feedback

**Steps:**

#### Step 1: Create/Verify Supabase Project

1. Navigate to https://supabase.com/dashboard
2. Select existing project or create new one
3. Note the project reference ID
4. Verify project is active and accessible

#### Step 2: Deploy Schema via SQL Editor

1. **Open SQL Editor**
   - Dashboard → SQL Editor
   - Click "New query"

2. **Copy Schema File**
   ```bash
   cat database_schemas/cosing_ingredients_schema.sql
   ```

3. **Execute Schema**
   - Paste entire schema into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for completion (~10 seconds)

4. **Verify Schema Deployment**
   ```sql
   -- Check tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'cosing%';
   
   -- Expected: cosing_ingredients, cosing_functions, cosing_restrictions
   
   -- Check indexes
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'cosing_ingredients';
   
   -- Expected: 7 indexes
   
   -- Check views
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'cosing%';
   
   -- Expected: 3 views
   ```

#### Step 3: Import Data via Python Script

1. **Install Supabase Client**
   ```bash
   sudo pip3 install supabase
   ```

2. **Set Environment Variables**
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-service-role-key"
   ```

3. **Run Import Script**
   ```bash
   cd /home/ubuntu
   python3 import_cosing_to_supabase.py
   ```

4. **Monitor Progress**
   - Script imports in batches of 100
   - Total batches: ~301
   - Expected duration: 5-10 minutes
   - Progress updates every 10 batches

5. **Verify Import**
   ```sql
   SELECT COUNT(*) FROM public.cosing_ingredients;
   -- Expected: 30070
   ```

### Method 2: Direct PostgreSQL Connection

**Advantages:**
- Faster for large datasets
- Familiar psql commands
- Better for automation

**Steps:**

#### Step 1: Get Connection String

1. Dashboard → Project Settings → Database
2. Copy connection string
3. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

#### Step 2: Deploy Schema

```bash
# Download schema file
cd /home/ubuntu/skintwinformx

# Execute schema
psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -f database_schemas/cosing_ingredients_schema.sql
```

#### Step 3: Import Data via COPY

```bash
# Decompress CSV if needed
cd vessels/cosing
gunzip -k cosing_ingredients.csv.gz

# Import via psql
psql "postgresql://postgres:[password]@[host]:5432/postgres" << 'EOF'
COPY public.cosing_ingredients(
    cosing_ref_no, inci_name, inn_name, ph_eur_name,
    cas_no, ec_no, chem_iupac_name_description,
    restriction, function, update_date
)
FROM '/path/to/cosing_ingredients.csv'
DELIMITER ','
CSV HEADER;
EOF
```

#### Step 4: Verify Import

```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -c "SELECT COUNT(*) FROM public.cosing_ingredients;"
```

### Method 3: Supabase CLI

**Advantages:**
- Command-line workflow
- Version control friendly
- Repeatable deployments

**Steps:**

#### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

#### Step 2: Link Project

```bash
supabase link --project-ref your-project-ref
```

#### Step 3: Deploy Schema

```bash
supabase db push --schema database_schemas/cosing_ingredients_schema.sql
```

#### Step 4: Import Data

```bash
# Use Method 1 or Method 2 for data import
# Supabase CLI doesn't have built-in bulk import
```

## Schema Details

### Tables

#### 1. cosing_ingredients (Main Table)

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `cosing_ref_no` - INTEGER NOT NULL UNIQUE
- `inci_name` - TEXT NOT NULL
- `inn_name` - TEXT
- `ph_eur_name` - TEXT
- `cas_no` - TEXT
- `ec_no` - TEXT
- `chem_iupac_name_description` - TEXT
- `restriction` - TEXT
- `function` - TEXT
- `update_date` - DATE
- `created_at` - TIMESTAMP DEFAULT NOW()
- `updated_at` - TIMESTAMP DEFAULT NOW()

**Indexes:**
- idx_cosing_ref_no (B-tree)
- idx_inci_name (B-tree)
- idx_function (B-tree)
- idx_cas_no (B-tree)
- idx_ec_no (B-tree)
- idx_inci_name_trgm (GIN trigram)
- idx_chem_desc_trgm (GIN trigram)

#### 2. cosing_functions

**Purpose:** Catalog of unique ingredient functions

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `function_name` - TEXT NOT NULL UNIQUE
- `description` - TEXT
- `category` - TEXT
- `created_at` - TIMESTAMP DEFAULT NOW()

#### 3. cosing_restrictions

**Purpose:** Detailed restriction information

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `cosing_ref_no` - INTEGER NOT NULL (FK to cosing_ingredients)
- `restriction_type` - TEXT
- `restriction_details` - TEXT
- `max_concentration` - DECIMAL(10,4)
- `conditions` - TEXT
- `created_at` - TIMESTAMP DEFAULT NOW()

### Views

#### 1. cosing_function_stats

**Purpose:** Aggregate statistics by function

**Columns:**
- `function` - Ingredient function
- `ingredient_count` - Total ingredients
- `restricted_count` - Restricted ingredients
- `with_cas_count` - Ingredients with CAS numbers

#### 2. cosing_recent_updates

**Purpose:** Latest 100 updated ingredients

**Columns:**
- `cosing_ref_no`
- `inci_name`
- `function`
- `update_date`
- `restriction`

#### 3. cosing_restricted_ingredients

**Purpose:** All restricted ingredients

**Columns:**
- `cosing_ref_no`
- `inci_name`
- `function`
- `restriction`
- `update_date`

### Functions

#### 1. search_cosing_ingredients(search_term TEXT, limit_count INTEGER)

**Purpose:** Fuzzy search by INCI name

**Returns:** Table with similarity scores

**Example:**
```sql
SELECT * FROM search_cosing_ingredients('hyaluronic', 10);
```

#### 2. get_ingredient_by_cas(cas_number TEXT)

**Purpose:** Find ingredients by CAS number

**Returns:** Ingredient details

**Example:**
```sql
SELECT * FROM get_ingredient_by_cas('9004-61-9');
```

#### 3. get_ingredients_by_function(function_name TEXT)

**Purpose:** Filter by cosmetic function

**Returns:** Ingredients with function

**Example:**
```sql
SELECT * FROM get_ingredients_by_function('UV FILTER');
```

#### 4. update_cosing_timestamp()

**Purpose:** Automatic timestamp updates

**Type:** Trigger function

**Fires:** BEFORE UPDATE on cosing_ingredients

## Data Import Process

### Batch Import Strategy

**Recommended Batch Size:**
- Supabase REST API: 100 records per batch
- Direct PostgreSQL: 500-1000 records per batch
- Total batches: ~301 (REST API) or ~61 (PostgreSQL)

**Import Duration:**
- REST API: 5-10 minutes
- PostgreSQL COPY: 1-2 minutes
- Verification: < 1 minute

### Import Script Features

**Python Script:** `import_cosing_to_supabase.py`

**Features:**
- Automatic connection testing
- Schema verification before import
- Batch processing with progress indicators
- Error handling and retry logic
- Final count verification
- Detailed logging

**Usage:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"
python3 import_cosing_to_supabase.py
```

**Output:**
```
============================================================
COSING Data Import to Supabase
============================================================
Start time: 2025-11-16 12:00:00

Checking Supabase connection and schema... ✅ Connected (current records: 0)

Reading CSV file...
Importing batch 1 (100 ingredients)... ✅ (100 imported)
Importing batch 2 (100 ingredients)... ✅ (100 imported)
...
Progress: 10000 ingredients imported
...
Importing final batch 301 (70 ingredients)... ✅ (70 imported)

============================================================
Import Complete!
End time: 2025-11-16 12:08:45
Total imported: 30070
Total errors: 0
============================================================

Verifying import... ✅ Final count: 30070
```

## Verification Procedures

### Post-Deployment Checks

#### 1. Record Count Verification

```sql
SELECT COUNT(*) as total_ingredients 
FROM public.cosing_ingredients;
-- Expected: 30070
```

#### 2. Data Quality Checks

```sql
-- Check for duplicates
SELECT cosing_ref_no, COUNT(*) 
FROM cosing_ingredients 
GROUP BY cosing_ref_no 
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Check INCI name coverage
SELECT COUNT(*) 
FROM cosing_ingredients 
WHERE inci_name IS NULL OR inci_name = '';
-- Expected: 0

-- Check function distribution
SELECT COUNT(DISTINCT function) 
FROM cosing_ingredients 
WHERE function IS NOT NULL;
-- Expected: 100+
```

#### 3. Index Verification

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'cosing_ingredients'
ORDER BY indexname;
-- Expected: 7 indexes
```

#### 4. View Verification

```sql
-- Test function stats view
SELECT COUNT(*) FROM cosing_function_stats;
-- Expected: 100+ rows

-- Test restricted ingredients view
SELECT COUNT(*) FROM cosing_restricted_ingredients;
-- Expected: ~1944 rows

-- Test recent updates view
SELECT COUNT(*) FROM cosing_recent_updates;
-- Expected: 100 rows
```

#### 5. Function Testing

```sql
-- Test fuzzy search
SELECT * FROM search_cosing_ingredients('hyaluronic', 5);
-- Expected: 5 results with similarity scores

-- Test CAS lookup
SELECT * FROM get_ingredient_by_cas('9004-61-9');
-- Expected: Matching ingredients

-- Test function filter
SELECT COUNT(*) FROM get_ingredients_by_function('MOISTURISING');
-- Expected: Multiple results
```

### Performance Testing

#### Query Performance

```sql
-- Test reference number lookup
EXPLAIN ANALYZE
SELECT * FROM cosing_ingredients WHERE cosing_ref_no = 34315;
-- Expected: < 1ms using index

-- Test INCI name search
EXPLAIN ANALYZE
SELECT * FROM cosing_ingredients WHERE inci_name = 'HYALURONIC ACID';
-- Expected: < 10ms using index

-- Test fuzzy search
EXPLAIN ANALYZE
SELECT * FROM search_cosing_ingredients('hyaluronic', 10);
-- Expected: < 100ms using trigram index
```

#### Index Usage

```sql
-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'cosing_ingredients'
ORDER BY idx_scan DESC;
```

## Supabase-Specific Features

### Real-Time Subscriptions

**Enable Real-Time:**
```sql
ALTER PUBLICATION supabase_realtime 
ADD TABLE cosing_ingredients;
```

**Subscribe to Changes (JavaScript):**
```javascript
const { data, error } = supabase
  .channel('cosing_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'cosing_ingredients'
  }, payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

### Row Level Security (RLS)

**Enable RLS:**
```sql
ALTER TABLE cosing_ingredients ENABLE ROW LEVEL SECURITY;
```

**Create Policies:**
```sql
-- Allow public read access
CREATE POLICY "Allow public read access"
ON cosing_ingredients
FOR SELECT
TO public
USING (true);

-- Restrict write access to authenticated users
CREATE POLICY "Allow authenticated write access"
ON cosing_ingredients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### API Auto-Generation

**REST API Endpoints (Auto-Generated):**

```javascript
// Get all ingredients
const { data, error } = await supabase
  .from('cosing_ingredients')
  .select('*')

// Search by INCI name
const { data, error } = await supabase
  .from('cosing_ingredients')
  .select('*')
  .ilike('inci_name', '%hyaluronic%')

// Get by COSING ref no
const { data, error } = await supabase
  .from('cosing_ingredients')
  .select('*')
  .eq('cosing_ref_no', 34315)
  .single()

// Filter by function
const { data, error } = await supabase
  .from('cosing_ingredients')
  .select('*')
  .ilike('function', '%MOISTURISING%')

// Get restricted ingredients
const { data, error } = await supabase
  .from('cosing_restricted_ingredients')
  .select('*')
```

### Storage Integration

**Store PIF Documents:**
```javascript
// Upload PIF document
const { data, error } = await supabase.storage
  .from('pif-documents')
  .upload('zone-anti-inflamm-ageing.pdf', file)

// Link to ingredient
await supabase
  .from('ingredient_documents')
  .insert({
    cosing_ref_no: 94753,
    document_url: data.path
  })
```

## Integration with Skintwinformx

### Hypergraph Integration

**Create Ingredient Nodes:**
```javascript
// Fetch all ingredients
const { data: ingredients } = await supabase
  .from('cosing_ingredients')
  .select('*')

// Create hypergraph nodes
const nodes = ingredients.map(ing => ({
  id: `COSING_${ing.cosing_ref_no}`,
  type: 'ingredient',
  source: 'COSING',
  properties: {
    cosing_ref_no: ing.cosing_ref_no,
    inci_name: ing.inci_name,
    function: ing.function,
    has_restriction: ing.restriction !== null
  }
}))

// Store in hypergraph database
await storeHypergraphNodes(nodes)
```

### Formulation Linking

**Link Ingredients to Formulations:**
```sql
-- Create formulation_ingredients table
CREATE TABLE formulation_ingredients (
    id SERIAL PRIMARY KEY,
    formulation_id INTEGER NOT NULL,
    cosing_ref_no INTEGER NOT NULL REFERENCES cosing_ingredients(cosing_ref_no),
    concentration DECIMAL(10, 4),
    function_in_formulation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Query formulation with ingredient details
SELECT 
    f.name as formulation_name,
    ci.inci_name,
    fi.concentration,
    ci.function,
    ci.restriction
FROM formulations f
JOIN formulation_ingredients fi ON f.id = fi.formulation_id
JOIN cosing_ingredients ci ON fi.cosing_ref_no = ci.cosing_ref_no
WHERE f.id = 123;
```

### PIF Integration

**Link PIFs to Ingredients:**
```sql
-- Create PIF-ingredient mapping
CREATE TABLE pif_ingredients (
    id SERIAL PRIMARY KEY,
    pif_id TEXT NOT NULL,
    cosing_ref_no INTEGER NOT NULL REFERENCES cosing_ingredients(cosing_ref_no),
    percentage DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Get complete PIF ingredient information
SELECT 
    p.pif_name,
    ci.inci_name,
    ci.cas_no,
    ci.function,
    ci.restriction,
    pi.percentage
FROM pif_documents p
JOIN pif_ingredients pi ON p.id = pi.pif_id
JOIN cosing_ingredients ci ON pi.cosing_ref_no = ci.cosing_ref_no
WHERE p.id = 'ZONE_ANTI_INFLAMM_AGEING';
```

## Troubleshooting

### Common Issues

#### Issue 1: Schema Deployment Fails

**Symptom:** Error executing schema SQL

**Possible Causes:**
- pg_trgm extension not available
- Insufficient permissions
- Syntax errors

**Solutions:**
```sql
-- Check pg_trgm extension
SELECT * FROM pg_available_extensions WHERE name = 'pg_trgm';

-- Enable extension (requires superuser or extension creator role)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- If extension unavailable, remove trigram indexes from schema
-- (Search functionality will be limited)
```

#### Issue 2: Data Import Fails

**Symptom:** Batch import errors

**Possible Causes:**
- Duplicate COSING reference numbers
- Data type mismatches
- Connection timeouts

**Solutions:**
```python
# Add error handling to import script
try:
    result = supabase.table('cosing_ingredients').insert(batch_data).execute()
except Exception as e:
    print(f"Error: {e}")
    # Log failed batch for manual review
    with open('failed_batches.json', 'a') as f:
        json.dump(batch_data, f)
```

#### Issue 3: Slow Query Performance

**Symptom:** Queries take > 1 second

**Solutions:**
```sql
-- Rebuild indexes
REINDEX TABLE cosing_ingredients;

-- Analyze table
ANALYZE cosing_ingredients;

-- Check for missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename = 'cosing_ingredients'
AND n_distinct > 100;
```

#### Issue 4: Connection Errors

**Symptom:** Cannot connect to Supabase

**Possible Causes:**
- Invalid API key
- Project paused/deleted
- Network issues

**Solutions:**
```bash
# Test connection
curl "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

# Expected: 200 OK

# Check project status in dashboard
# Verify API keys in Project Settings → API
```

## Maintenance

### Regular Updates

**Quarterly COSING Update:**
1. Download latest COSING Excel from European Commission
2. Run conversion script
3. Compare with existing data
4. Update database if changes found

**Update Process:**
```sql
-- Backup existing data
CREATE TABLE cosing_ingredients_backup AS 
SELECT * FROM cosing_ingredients;

-- Truncate and reload
TRUNCATE TABLE cosing_ingredients CASCADE;

-- Import new data (using import script)
-- ...

-- Verify count
SELECT COUNT(*) FROM cosing_ingredients;
-- Expected: >= 30070
```

### Backup Strategy

**Supabase Automatic Backups:**
- Daily automated backups (Pro plan)
- Point-in-time recovery available
- Backup retention: 7-30 days

**Manual Backups:**
```bash
# Export via pg_dump
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" \
  --table=cosing_ingredients \
  --data-only \
  --format=custom \
  --file=cosing_backup_$(date +%Y%m%d).dump

# Export to CSV
psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -c "COPY (SELECT * FROM cosing_ingredients) TO STDOUT CSV HEADER" \
  > cosing_backup_$(date +%Y%m%d).csv
```

### Monitoring

**Key Metrics to Monitor:**
- Table size growth
- Query performance
- Index usage
- Connection count
- Error rates

**Monitoring Queries:**
```sql
-- Table size
SELECT 
    pg_size_pretty(pg_total_relation_size('cosing_ingredients')) as total_size,
    pg_size_pretty(pg_relation_size('cosing_ingredients')) as table_size,
    pg_size_pretty(pg_total_relation_size('cosing_ingredients') - pg_relation_size('cosing_ingredients')) as index_size;

-- Query statistics
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%cosing_ingredients%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

## Comparison: Neon vs Supabase

| Feature | Neon | Supabase |
|---------|------|----------|
| **Database** | PostgreSQL 17 | PostgreSQL 15+ |
| **Deployment Status** | ✅ Complete | 📋 Pending |
| **Records** | 30,070 | - |
| **Branching** | ✅ Native | ⚠️ Via migrations |
| **Serverless** | ✅ Yes | ⚠️ Partial |
| **Auto-scaling** | ✅ Yes | ⚠️ Limited |
| **Real-time** | ❌ No | ✅ Yes |
| **REST API** | ❌ No | ✅ Auto-generated |
| **Auth** | ❌ No | ✅ Built-in |
| **Storage** | ❌ No | ✅ Built-in |
| **Dashboard** | ✅ Yes | ✅ Yes |
| **CLI** | ✅ Yes | ✅ Yes |

**Recommendation:**
- **Neon:** Primary database for production workloads
- **Supabase:** API layer and real-time features
- **Strategy:** Use both with data synchronization

## Next Steps

### Immediate Actions

1. **Verify Supabase Instance**
   - Check project status in dashboard
   - Confirm instance is active
   - Verify API keys are valid

2. **Deploy Schema**
   - Use Method 1 (Dashboard) for initial deployment
   - Verify all objects created successfully
   - Test sample queries

3. **Import Data**
   - Run Python import script
   - Monitor progress
   - Verify final count

### Short-Term Goals

1. **Enable Real-Time**
   - Configure real-time subscriptions
   - Test change notifications
   - Integrate with frontend

2. **Set Up RLS**
   - Define security policies
   - Test access controls
   - Document permissions

3. **Create API Endpoints**
   - Document REST API usage
   - Create example queries
   - Build client libraries

### Long-Term Goals

1. **Data Synchronization**
   - Implement Neon → Supabase sync
   - Schedule regular updates
   - Monitor sync status

2. **Hypergraph Integration**
   - Create ingredient nodes
   - Link to formulations
   - Build relationship queries

3. **Advanced Features**
   - Implement search interface
   - Add recommendation engine
   - Build analytics dashboard

## Conclusion

This guide provides comprehensive instructions for deploying the COSING database to Supabase. The deployment mirrors the successful Neon implementation and includes all necessary schema objects, data import procedures, and verification steps.

**Key Points:**
- Schema deployment via dashboard or direct SQL
- Data import via REST API or PostgreSQL COPY
- Comprehensive verification procedures
- Supabase-specific features (real-time, RLS, auto-API)
- Integration with skintwinformx hypergraph

**Status:**
- ✅ Neon deployment complete (30,070 ingredients)
- 📋 Supabase deployment pending (awaiting active instance)
- 📋 Hypergraph integration pending
- 📋 API development pending

---

**Document Version:** 1.0  
**Last Updated:** November 16, 2025  
**Next Review:** When Supabase instance is active  
**Related Documents:**
- COSING_NEON_DEPLOYMENT_REPORT_NOV16_2025.md
- COSING_INTEGRATION_REPORT_NOV16_2025.md
- database_schemas/cosing_ingredients_schema.sql
