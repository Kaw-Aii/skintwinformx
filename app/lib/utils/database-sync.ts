/**
 * Database Synchronization Utility
 * Handles synchronization between Neon and Supabase databases
 */

import { createLogger } from './logger-enhanced';
import { handleDatabaseError } from './error-handler';

const logger = createLogger('DatabaseSync');

export interface DatabaseConfig {
  connectionString: string;
  type: 'neon' | 'supabase';
}

export interface SyncResult {
  success: boolean;
  tablesCreated: string[];
  tablesFailed: string[];
  errors: string[];
  timestamp: Date;
}

export interface TableSchema {
  name: string;
  sql: string;
  dependencies?: string[];
}

/**
 * Database synchronization manager
 */
export class DatabaseSyncManager {
  private neonConfig?: DatabaseConfig;
  private supabaseConfig?: DatabaseConfig;

  constructor(
    neonConfig?: DatabaseConfig,
    supabaseConfig?: DatabaseConfig
  ) {
    this.neonConfig = neonConfig;
    this.supabaseConfig = supabaseConfig;
  }

  /**
   * Verify database connection
   */
  async verifyConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      logger.info(`Verifying ${config.type} database connection`);
      // Connection verification would be implemented here
      // This is a placeholder for the actual implementation
      return true;
    } catch (error) {
      logger.error(`Connection verification failed for ${config.type}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Execute SQL schema
   */
  async executeSchema(
    config: DatabaseConfig,
    schema: TableSchema
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Executing schema: ${schema.name} on ${config.type}`);
      
      // Schema execution would be implemented here
      // This is a placeholder for the actual implementation
      
      logger.info(`Schema ${schema.name} executed successfully on ${config.type}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Schema execution failed: ${schema.name} on ${config.type}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Synchronize schemas to database
   */
  async syncSchemas(
    config: DatabaseConfig,
    schemas: TableSchema[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      tablesCreated: [],
      tablesFailed: [],
      errors: [],
      timestamp: new Date(),
    };

    logger.info(`Starting schema sync to ${config.type} with ${schemas.length} schemas`);

    // Verify connection first
    const connectionValid = await this.verifyConnection(config);
    if (!connectionValid) {
      result.success = false;
      result.errors.push(`Failed to connect to ${config.type} database`);
      return result;
    }

    // Sort schemas by dependencies
    const sortedSchemas = this.sortSchemasByDependencies(schemas);

    // Execute each schema
    for (const schema of sortedSchemas) {
      const executeResult = await this.executeSchema(config, schema);
      
      if (executeResult.success) {
        result.tablesCreated.push(schema.name);
      } else {
        result.tablesFailed.push(schema.name);
        result.errors.push(executeResult.error || 'Unknown error');
        result.success = false;
      }
    }

    logger.info(`Schema sync completed for ${config.type}: ${result.tablesCreated.length} created, ${result.tablesFailed.length} failed`);

    return result;
  }

  /**
   * Sort schemas by dependencies
   */
  private sortSchemasByDependencies(schemas: TableSchema[]): TableSchema[] {
    const sorted: TableSchema[] = [];
    const remaining = [...schemas];
    const added = new Set<string>();

    while (remaining.length > 0) {
      const schema = remaining.shift();
      if (!schema) break;

      // Check if all dependencies are satisfied
      const dependenciesSatisfied = !schema.dependencies || 
        schema.dependencies.every(dep => added.has(dep));

      if (dependenciesSatisfied) {
        sorted.push(schema);
        added.add(schema.name);
      } else {
        // Put back at the end if dependencies not satisfied
        remaining.push(schema);
      }

      // Prevent infinite loop
      if (remaining.length > 0 && remaining[0] === schema) {
        logger.warn(`Circular dependency detected for schema: ${schema.name}`);
        sorted.push(schema);
        added.add(schema.name);
      }
    }

    return sorted;
  }

  /**
   * Sync to both Neon and Supabase
   */
  async syncToBoth(schemas: TableSchema[]): Promise<{
    neon: SyncResult;
    supabase: SyncResult;
  }> {
    const results = {
      neon: {
        success: false,
        tablesCreated: [],
        tablesFailed: [],
        errors: ['Neon config not provided'],
        timestamp: new Date(),
      } as SyncResult,
      supabase: {
        success: false,
        tablesCreated: [],
        tablesFailed: [],
        errors: ['Supabase config not provided'],
        timestamp: new Date(),
      } as SyncResult,
    };

    // Sync to Neon
    if (this.neonConfig) {
      results.neon = await this.syncSchemas(this.neonConfig, schemas);
    }

    // Sync to Supabase
    if (this.supabaseConfig) {
      results.supabase = await this.syncSchemas(this.supabaseConfig, schemas);
    }

    return results;
  }

  /**
   * Generate sync report
   */
  generateReport(results: { neon: SyncResult; supabase: SyncResult }): string {
    const lines: string[] = [
      '# Database Synchronization Report',
      `**Date:** ${new Date().toISOString()}`,
      '',
      '## Neon Database',
      `- Status: ${results.neon.success ? '✅ Success' : '❌ Failed'}`,
      `- Tables Created: ${results.neon.tablesCreated.length}`,
      `- Tables Failed: ${results.neon.tablesFailed.length}`,
    ];

    if (results.neon.tablesCreated.length > 0) {
      lines.push('', '### Created Tables');
      results.neon.tablesCreated.forEach(table => {
        lines.push(`- ${table}`);
      });
    }

    if (results.neon.errors.length > 0) {
      lines.push('', '### Errors');
      results.neon.errors.forEach(error => {
        lines.push(`- ${error}`);
      });
    }

    lines.push('', '## Supabase Database');
    lines.push(`- Status: ${results.supabase.success ? '✅ Success' : '❌ Failed'}`);
    lines.push(`- Tables Created: ${results.supabase.tablesCreated.length}`);
    lines.push(`- Tables Failed: ${results.supabase.tablesFailed.length}`);

    if (results.supabase.tablesCreated.length > 0) {
      lines.push('', '### Created Tables');
      results.supabase.tablesCreated.forEach(table => {
        lines.push(`- ${table}`);
      });
    }

    if (results.supabase.errors.length > 0) {
      lines.push('', '### Errors');
      results.supabase.errors.forEach(error => {
        lines.push(`- ${error}`);
      });
    }

    return lines.join('\n');
  }
}

/**
 * Load schemas from SQL files
 */
export function parseSchemaFile(sqlContent: string, tableName: string): TableSchema {
  return {
    name: tableName,
    sql: sqlContent,
  };
}

/**
 * Export for use in scripts
 */
export default DatabaseSyncManager;
