/**
 * Database Helper Utilities
 * Provides common database operations and query builders
 */

import { handleDatabaseError } from './error-handler';
import { createLogger } from './logger-enhanced';

const logger = createLogger('DatabaseHelpers');

/**
 * Query result wrapper
 */
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Build pagination query
 */
export function buildPaginationQuery(params: PaginationParams): {
  limit: number;
  offset: number;
  orderBy?: string;
} {
  const { page, pageSize, sortBy, sortOrder = 'asc' } = params;
  
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: sortBy ? `${sortBy} ${sortOrder.toUpperCase()}` : undefined,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  totalCount: number,
  page: number,
  pageSize: number
): PaginatedResult<never>['pagination'] {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Safe database query execution
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  context?: string
): Promise<QueryResult<T>> {
  try {
    const data = await queryFn();
    logger.debug(`Query successful${context ? ` - ${context}` : ''}`);
    return { data, error: null };
  } catch (error) {
    logger.error(`Query failed: ${error}${context ? ` - ${context}` : ''}`);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Execute query with retry logic
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Query attempt ${attempt}/${maxRetries}`);
      return await queryFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Query attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  logger.error(`Query failed after ${maxRetries} attempts`);
  handleDatabaseError(lastError);
}

/**
 * Batch insert helper
 */
export async function batchInsert<T>(
  insertFn: (batch: T[]) => Promise<void>,
  items: T[],
  batchSize: number = 100
): Promise<void> {
  const batches = Math.ceil(items.length / batchSize);
  
  logger.info(`Starting batch insert: ${items.length} items in ${batches} batches`);

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);

    try {
      await insertFn(batch);
      logger.debug(`Batch ${i + 1}/${batches} inserted successfully`);
    } catch (error) {
      logger.error(`Batch ${i + 1}/${batches} failed: ${error}`);
      throw error;
    }
  }

  logger.info(`Batch insert completed: ${items.length} items`);
}

/**
 * Build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, unknown>
): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // IN clause for arrays
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        values.push(...value);
      } else {
        // Equality clause
        conditions.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

/**
 * Build UPDATE SET clause
 */
export function buildSetClause(
  updates: Record<string, unknown>,
  startIndex: number = 1
): { clause: string; values: unknown[] } {
  const assignments: string[] = [];
  const values: unknown[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      assignments.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  }

  return {
    clause: assignments.length > 0 ? `SET ${assignments.join(', ')}` : '',
    values,
  };
}

/**
 * Sanitize table/column name
 */
export function sanitizeIdentifier(identifier: string): string {
  // Remove any characters that aren't alphanumeric or underscore
  const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');
  
  if (sanitized !== identifier) {
    logger.warn(`Identifier sanitized: "${identifier}" -> "${sanitized}"`);
  }

  return sanitized;
}

/**
 * Build search query with LIKE
 */
export function buildSearchClause(
  searchTerm: string,
  columns: string[],
  paramIndex: number = 1
): { clause: string; value: string } {
  const searchPattern = `%${searchTerm}%`;
  const conditions = columns.map(col => `${col} ILIKE $${paramIndex}`).join(' OR ');

  return {
    clause: conditions ? `(${conditions})` : '',
    value: searchPattern,
  };
}

/**
 * Transaction helper
 */
export interface Transaction {
  query: <T>(sql: string, params?: unknown[]) => Promise<T>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

/**
 * Execute operations in transaction
 */
export async function withTransaction<T>(
  getTransaction: () => Promise<Transaction>,
  operations: (tx: Transaction) => Promise<T>
): Promise<T> {
  const tx = await getTransaction();

  try {
    logger.debug('Transaction started');
    const result = await operations(tx);
    await tx.commit();
    logger.debug('Transaction committed');
    return result;
  } catch (error) {
    logger.error(`Transaction failed: ${error}`);
    await tx.rollback();
    logger.debug('Transaction rolled back');
    throw error;
  }
}

/**
 * Build JSONB query for PostgreSQL
 */
export function buildJsonbQuery(
  column: string,
  path: string[],
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=',
  value: unknown,
  paramIndex: number = 1
): { clause: string; value: unknown } {
  const jsonPath = path.map(p => `'${p}'`).join('->');
  const clause = `${column}->${jsonPath} ${operator} $${paramIndex}`;

  return { clause, value };
}

/**
 * Upsert helper (INSERT ... ON CONFLICT)
 */
export function buildUpsertQuery(
  table: string,
  data: Record<string, unknown>,
  conflictColumns: string[],
  updateColumns: string[]
): { query: string; values: unknown[] } {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  const updateSet = updateColumns
    .map(col => `${col} = EXCLUDED.${col}`)
    .join(', ');

  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${conflictColumns.join(', ')})
    DO UPDATE ${updateSet}
    RETURNING *
  `.trim();

  return { query, values };
}

/**
 * Check if table exists
 */
export function buildTableExistsQuery(tableName: string): string {
  return `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '${sanitizeIdentifier(tableName)}'
    )
  `.trim();
}

/**
 * Get table row count
 */
export function buildCountQuery(
  tableName: string,
  whereClause?: string
): string {
  const where = whereClause ? ` ${whereClause}` : '';
  return `SELECT COUNT(*) as count FROM ${sanitizeIdentifier(tableName)}${where}`;
}
