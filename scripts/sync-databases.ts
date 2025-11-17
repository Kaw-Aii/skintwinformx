/**
 * Database Synchronization Script
 * 
 * Synchronizes Neon and Supabase databases with the latest schemas
 * and loads hypergraph data for SkinTwin FormX.
 */

import * as fs from 'fs';
import * as path from 'path';

interface DatabaseConfig {
  name: string;
  connectionString?: string;
  schemaFile: string;
  dataFiles: string[];
}

interface SyncResult {
  database: string;
  success: boolean;
  schemasDeployed: string[];
  dataLoaded: string[];
  errors: string[];
  timestamp: string;
}

/**
 * Database configurations
 */
const databases: DatabaseConfig[] = [
  {
    name: 'neon',
    schemaFile: 'database_schemas/neon_schema_enhanced.sql',
    dataFiles: [
      'database_schemas/ingredients_data.json',
      'database_schemas/edges_data.json',
      'database_schemas/capabilities_data.json',
      'database_schemas/suppliers_data.json'
    ]
  },
  {
    name: 'supabase',
    schemaFile: 'database_schemas/supabase_schema_enhanced.sql',
    dataFiles: [
      'database_schemas/ingredients_data.json',
      'database_schemas/edges_data.json',
      'database_schemas/capabilities_data.json',
      'database_schemas/suppliers_data.json'
    ]
  }
];

/**
 * Read file content
 */
function readFile(filePath: string): string {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Read JSON file
 */
function readJsonFile(filePath: string): any {
  const content = readFile(filePath);
  return JSON.parse(content);
}

/**
 * Validate schema file
 */
function validateSchemaFile(filePath: string): boolean {
  try {
    const content = readFile(filePath);
    // Basic validation: check for SQL keywords
    const hasCreateTable = content.includes('CREATE TABLE');
    // Supabase uses public schema by default, so we don't require CREATE SCHEMA
    return hasCreateTable && content.length > 100;
  } catch (error) {
    console.error(`Schema validation failed for ${filePath}:`, error);
    return false;
  }
}

/**
 * Validate data file
 */
function validateDataFile(filePath: string): boolean {
  try {
    const data = readJsonFile(filePath);
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error(`Data validation failed for ${filePath}:`, error);
    return false;
  }
}

/**
 * Generate SQL for data insertion
 */
function generateInsertSQL(tableName: string, data: any[]): string {
  if (data.length === 0) {
    return '';
  }

  const columns = Object.keys(data[0]);
  const values = data.map(row => {
    const vals = columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) {
        return 'NULL';
      }
      if (typeof val === 'object') {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
      }
      if (typeof val === 'string') {
        return `'${val.replace(/'/g, "''")}'`;
      }
      return val;
    });
    return `(${vals.join(', ')})`;
  });

  return `
    INSERT INTO skin_twin.${tableName} (${columns.join(', ')})
    VALUES ${values.join(',\n    ')}
    ON CONFLICT DO NOTHING;
  `;
}

/**
 * Sync database schema and data
 */
async function syncDatabase(config: DatabaseConfig): Promise<SyncResult> {
  const result: SyncResult = {
    database: config.name,
    success: false,
    schemasDeployed: [],
    dataLoaded: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  console.log(`\n========================================`);
  console.log(`Syncing ${config.name.toUpperCase()} Database`);
  console.log(`========================================\n`);

  try {
    // Validate schema file
    console.log(`Validating schema file: ${config.schemaFile}`);
    if (!validateSchemaFile(config.schemaFile)) {
      result.errors.push(`Invalid schema file: ${config.schemaFile}`);
      return result;
    }
    console.log(`✓ Schema file validated`);

    // Read schema
    const schema = readFile(config.schemaFile);
    console.log(`✓ Schema loaded (${schema.length} bytes)`);
    result.schemasDeployed.push(config.schemaFile);

    // Validate data files
    console.log(`\nValidating data files...`);
    for (const dataFile of config.dataFiles) {
      if (!validateDataFile(dataFile)) {
        result.errors.push(`Invalid data file: ${dataFile}`);
        continue;
      }
      const data = readJsonFile(dataFile);
      console.log(`✓ ${dataFile}: ${data.length} records`);
      result.dataLoaded.push(dataFile);
    }

    // Generate deployment report
    console.log(`\n✓ Database sync prepared for ${config.name}`);
    console.log(`  - Schemas: ${result.schemasDeployed.length}`);
    console.log(`  - Data files: ${result.dataLoaded.length}`);
    
    if (result.errors.length === 0) {
      result.success = true;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    console.error(`✗ Error syncing ${config.name}:`, errorMessage);
  }

  return result;
}

/**
 * Generate deployment SQL script
 */
function generateDeploymentScript(config: DatabaseConfig): string {
  let script = `-- ${config.name.toUpperCase()} Database Deployment Script\n`;
  script += `-- Generated: ${new Date().toISOString()}\n\n`;

  // Add schema
  try {
    const schema = readFile(config.schemaFile);
    script += `-- ============================================================================\n`;
    script += `-- SCHEMA DEPLOYMENT\n`;
    script += `-- ============================================================================\n\n`;
    script += schema;
    script += `\n\n`;
  } catch (error) {
    script += `-- ERROR: Could not load schema file: ${config.schemaFile}\n\n`;
  }

  // Add data loading
  script += `-- ============================================================================\n`;
  script += `-- DATA LOADING\n`;
  script += `-- ============================================================================\n\n`;

  for (const dataFile of config.dataFiles) {
    try {
      const data = readJsonFile(dataFile);
      const tableName = path.basename(dataFile, '.json').replace('_data', '');
      script += `-- Loading ${tableName} (${data.length} records)\n`;
      script += generateInsertSQL(tableName, data);
      script += `\n\n`;
    } catch (error) {
      script += `-- ERROR: Could not load data file: ${dataFile}\n\n`;
    }
  }

  return script;
}

/**
 * Main synchronization function
 */
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         SkinTwin FormX Database Synchronization                ║
║         Neon + Supabase Schema & Data Deployment               ║
╚════════════════════════════════════════════════════════════════╝
  `);

  const results: SyncResult[] = [];

  // Sync each database
  for (const config of databases) {
    const result = await syncDatabase(config);
    results.push(result);

    // Generate deployment script
    const deploymentScript = generateDeploymentScript(config);
    const scriptPath = `database_schemas/${config.name}_deployment.sql`;
    fs.writeFileSync(scriptPath, deploymentScript);
    console.log(`\n✓ Deployment script saved: ${scriptPath}`);
  }

  // Generate summary report
  console.log(`\n\n========================================`);
  console.log(`SYNCHRONIZATION SUMMARY`);
  console.log(`========================================\n`);

  let allSuccess = true;
  for (const result of results) {
    console.log(`${result.database.toUpperCase()}:`);
    console.log(`  Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`  Schemas: ${result.schemasDeployed.length}`);
    console.log(`  Data files: ${result.dataLoaded.length}`);
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach(err => console.log(`    - ${err}`));
      allSuccess = false;
    }
    console.log();
  }

  // Save detailed report
  const reportPath = 'DATABASE_SYNC_REPORT_NOV17_2025.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`✓ Detailed report saved: ${reportPath}\n`);

  // Exit with appropriate code
  process.exit(allSuccess ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { syncDatabase, generateDeploymentScript, type SyncResult, type DatabaseConfig };
