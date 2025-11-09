/**
 * Database Utility Functions
 * Provides helpers for database operations and schema management
 */

import { logger } from './logger';
import { DatabaseError, handleDatabaseError } from './error-handler';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  fields?: Array<{ name: string; dataTypeID: number }>;
}

export interface ConnectionPool {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  end(): Promise<void>;
}

/**
 * Execute a SQL query with error handling and logging
 */
export async function executeQuery<T = unknown>(
  pool: ConnectionPool,
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const startTime = Date.now();
  
  try {
    logger.database('Executing query', { sql: sql.substring(0, 100) });
    
    const result = await pool.query<T>(sql, params);
    
    const duration = Date.now() - startTime;
    logger.performance('Query execution', duration, {
      rowCount: result.rowCount,
    });
    
    return result;
  } catch (error) {
    logger.error('Query execution failed', error as Error, {
      sql: sql.substring(0, 100),
      params,
    });
    handleDatabaseError(error);
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function executeTransaction(
  pool: ConnectionPool,
  queries: Array<{ sql: string; params?: unknown[] }>
): Promise<void> {
  const startTime = Date.now();
  
  try {
    logger.database('Starting transaction', { queryCount: queries.length });
    
    await pool.query('BEGIN');
    
    for (const query of queries) {
      await pool.query(query.sql, query.params);
    }
    
    await pool.query('COMMIT');
    
    const duration = Date.now() - startTime;
    logger.performance('Transaction execution', duration, {
      queryCount: queries.length,
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('Transaction failed and rolled back', error as Error);
    handleDatabaseError(error);
  }
}

/**
 * Check if a table exists
 */
export async function tableExists(
  pool: ConnectionPool,
  tableName: string,
  schema: string = 'public'
): Promise<boolean> {
  const result = await executeQuery<{ exists: boolean }>(
    pool,
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = $1 
      AND table_name = $2
    )`,
    [schema, tableName]
  );
  
  return result.rows[0]?.exists ?? false;
}

/**
 * Get table schema information
 */
export async function getTableSchema(
  pool: ConnectionPool,
  tableName: string,
  schema: string = 'public'
): Promise<Array<{ column_name: string; data_type: string; is_nullable: string }>> {
  const result = await executeQuery<{
    column_name: string;
    data_type: string;
    is_nullable: string;
  }>(
    pool,
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, tableName]
  );
  
  return result.rows;
}

/**
 * Execute a SQL file
 */
export async function executeSQLFile(
  pool: ConnectionPool,
  sqlContent: string
): Promise<void> {
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  logger.database('Executing SQL file', { statementCount: statements.length });
  
  for (const statement of statements) {
    if (statement.trim()) {
      await executeQuery(pool, statement);
    }
  }
}

/**
 * Create schema if not exists
 */
export async function ensureSchema(
  pool: ConnectionPool,
  schemaName: string
): Promise<void> {
  await executeQuery(
    pool,
    `CREATE SCHEMA IF NOT EXISTS ${schemaName}`
  );
  logger.info(`Schema ${schemaName} ensured`);
}

/**
 * Get database version
 */
export async function getDatabaseVersion(
  pool: ConnectionPool
): Promise<string> {
  const result = await executeQuery<{ version: string }>(
    pool,
    'SELECT version()'
  );
  
  return result.rows[0]?.version ?? 'unknown';
}

/**
 * Test database connection
 */
export async function testConnection(
  pool: ConnectionPool
): Promise<boolean> {
  try {
    await executeQuery(pool, 'SELECT 1');
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', error as Error);
    return false;
  }
}

/**
 * Get table row count
 */
export async function getTableRowCount(
  pool: ConnectionPool,
  tableName: string,
  schema: string = 'public'
): Promise<number> {
  const result = await executeQuery<{ count: string }>(
    pool,
    `SELECT COUNT(*) as count FROM ${schema}.${tableName}`
  );
  
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

/**
 * Vacuum and analyze table for performance
 */
export async function optimizeTable(
  pool: ConnectionPool,
  tableName: string,
  schema: string = 'public'
): Promise<void> {
  await executeQuery(pool, `VACUUM ANALYZE ${schema}.${tableName}`);
  logger.info(`Table ${schema}.${tableName} optimized`);
}

/**
 * Create index if not exists
 */
export async function ensureIndex(
  pool: ConnectionPool,
  indexName: string,
  tableName: string,
  columns: string[],
  schema: string = 'public'
): Promise<void> {
  const columnList = columns.join(', ');
  await executeQuery(
    pool,
    `CREATE INDEX IF NOT EXISTS ${indexName} 
     ON ${schema}.${tableName} (${columnList})`
  );
  logger.info(`Index ${indexName} ensured on ${schema}.${tableName}`);
}
