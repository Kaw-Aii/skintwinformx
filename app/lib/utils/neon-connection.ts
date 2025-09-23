/**
 * Neon Database Connection Utility
 * 
 * This module provides utilities for connecting to a Neon serverless Postgres database.
 * It supports both direct connection via the pg client and integration with the Neon MCP.
 */

import { Pool, PoolClient } from 'pg';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('neon-connection');

interface NeonConnectionOptions {
  connectionString?: string;
  projectId?: string;
  branchId?: string;
}

/**
 * Creates a connection pool for a Neon database
 */
export function createNeonPool(options: NeonConnectionOptions): Pool {
  const connectionString = options.connectionString || process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('No database connection string provided');
  }
  
  logger.debug('Creating Neon connection pool');
  
  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    // Neon-specific connection pool settings
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  });
}

/**
 * Executes a callback function with a Neon database client
 * Handles acquiring and releasing the client automatically
 */
export async function withNeonClient<T>(
  options: NeonConnectionOptions,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = createNeonPool(options);
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    logger.debug('Connected to Neon database');
    
    return await callback(client);
  } catch (error) {
    logger.error('Error executing Neon database operation:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
      logger.debug('Released Neon database client');
    }
    
    await pool.end();
    logger.debug('Closed Neon connection pool');
  }
}

/**
 * Executes a SQL query against a Neon database
 */
export async function executeNeonQuery<T = any>(
  options: NeonConnectionOptions,
  query: string,
  params: any[] = []
): Promise<T[]> {
  return withNeonClient(options, async (client) => {
    logger.debug('Executing query:', { query, params });
    const result = await client.query(query, params);
    return result.rows as T[];
  });
}

/**
 * Executes a SQL transaction against a Neon database
 */
export async function executeNeonTransaction<T = any>(
  options: NeonConnectionOptions,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withNeonClient(options, async (client) => {
    try {
      await client.query('BEGIN');
      logger.debug('Started transaction');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      logger.debug('Committed transaction');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Rolled back transaction:', error);
      throw error;
    }
  });
}

/**
 * Executes a Neon MCP operation using the manus-mcp-cli
 * This is a wrapper around the MCP CLI for use in server-side code
 */
export async function executeNeonMcpOperation<T = any>(
  operation: string,
  params: Record<string, any> = {}
): Promise<T> {
  try {
    logger.debug('Executing Neon MCP operation:', { operation, params });
    
    // In a real implementation, this would use the child_process module to execute the MCP CLI
    // For now, we'll just log the operation and return a mock response
    
    // Mock implementation - in production code, this would call the actual MCP CLI
    const mockResponse = { success: true, operation, params } as unknown as T;
    
    return mockResponse;
  } catch (error) {
    logger.error('Error executing Neon MCP operation:', error);
    throw error;
  }
}
