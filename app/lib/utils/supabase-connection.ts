/**
 * Supabase Connection Utility
 * 
 * This module provides utilities for connecting to a Supabase project's PostgreSQL database.
 * It supports both direct connection via the pg client and integration with the Supabase API.
 */

import { Pool, type PoolClient } from 'pg';
import { createScopedLogger } from '~/utils/logger';
import { supabaseConnection } from '~/lib/stores/supabase';

const logger = createScopedLogger('supabase-connection');

interface SupabaseConnectionOptions {
  projectId?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  connectionString?: string;
}

/**
 * Creates a connection pool for a Supabase database
 */
export function createSupabasePool(options: SupabaseConnectionOptions): Pool {
  // Try to get connection details from options, then from store, then from environment
  const connectionState = supabaseConnection.get();
  
  let connectionString = options.connectionString;
  let projectId = options.projectId || connectionState.selectedProjectId;
  let supabaseUrl = options.supabaseUrl || connectionState.credentials?.supabaseUrl || process.env.SUPABASE_URL;
  let supabaseKey = options.supabaseKey || connectionState.credentials?.anonKey || process.env.SUPABASE_KEY;
  
  // If we have a project ID but no connection string, construct one
  if (!connectionString && projectId && supabaseKey) {
    connectionString = `postgresql://postgres:${supabaseKey}@db.${projectId}.supabase.co:5432/postgres`;
  }
  
  if (!connectionString) {
    throw new Error('No Supabase database connection string available');
  }
  
  logger.debug('Creating Supabase connection pool');
  
  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  });
}

/**
 * Executes a callback function with a Supabase database client
 * Handles acquiring and releasing the client automatically
 */
export async function withSupabaseClient<T>(
  options: SupabaseConnectionOptions,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = createSupabasePool(options);
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    logger.debug('Connected to Supabase database');
    
    return await callback(client);
  } catch (error) {
    logger.error('Error executing Supabase database operation:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
      logger.debug('Released Supabase database client');
    }
    
    await pool.end();
    logger.debug('Closed Supabase connection pool');
  }
}

/**
 * Executes a SQL query against a Supabase database
 */
export async function executeSupabaseQuery<T = any>(
  options: SupabaseConnectionOptions,
  query: string,
  params: any[] = []
): Promise<T[]> {
  return withSupabaseClient(options, async (client) => {
    logger.debug('Executing query:', { query, params });
    const result = await client.query(query, params);
    return result.rows as T[];
  });
}

/**
 * Executes a SQL transaction against a Supabase database
 */
export async function executeSupabaseTransaction<T = any>(
  options: SupabaseConnectionOptions,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withSupabaseClient(options, async (client) => {
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
 * Executes a query against the Supabase API
 */
export async function executeSupabaseApiQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const connectionState = supabaseConnection.get();
    
    if (!connectionState.selectedProjectId || !connectionState.token) {
      throw new Error('No Supabase project selected or not authenticated');
    }
    
    logger.debug('Executing Supabase API query:', { query });
    
    const response = await fetch('/api/supabase/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${connectionState.token}`,
      },
      body: JSON.stringify({
        projectId: connectionState.selectedProjectId,
        query,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } };
      throw new Error(errorData.error?.message || 'Failed to execute Supabase query');
    }
    
    const result = await response.json() as { data: T[] };
    return result.data;
  } catch (error) {
    logger.error('Error executing Supabase API query:', error);
    throw error;
  }
}
