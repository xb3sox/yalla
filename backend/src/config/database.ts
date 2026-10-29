import { Pool, PoolConfig, PoolClient, QueryResult } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';
import config from './index';
import logger from '../utils/logger';

export interface RoutingContext {
  isPinnedToPrimary?: boolean;
  userId?: string;
}

export const routingStore = new AsyncLocalStorage<RoutingContext>();

const primaryConfig: PoolConfig = {
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
  query_timeout: 10000,
  ssl: config.env === 'production' && !config.database.url.includes('localhost') ? { rejectUnauthorized: false } : undefined,
};

export const primaryPool = new Pool(primaryConfig);

const replicaConnectionString = process.env.DATABASE_REPLICA_URL ||
  (config.database.replicaUrl !== config.database.url ? config.database.replicaUrl : undefined);

const replicaConfig: PoolConfig | undefined = replicaConnectionString ? {
  connectionString: replicaConnectionString,
  max: 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
  query_timeout: 10000,
  ssl: config.env === 'production' && !replicaConnectionString.includes('localhost') ? { rejectUnauthorized: false } : undefined,
} : undefined;

export const replicaPool = replicaConfig ? new Pool(replicaConfig) : primaryPool;

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase());
}

export function attachCamelCaseAliases(row: any): any {
  if (!row || typeof row !== 'object' || Array.isArray(row) || row instanceof Date) return row;
  for (const key of Object.keys(row)) {
    if (key.includes('_')) {
      const camel = toCamelCase(key);
      if (!(camel in row)) {
        row[camel] = row[key];
      }
    }
  }
  if (row.stripe_payment_id && !row.stripePaymentIntentId) {
    row.stripePaymentIntentId = row.stripe_payment_id;
  }
  return row;
}

function wrapPoolWithCamelCase(targetPool: Pool): Pool {
  const originalPoolQuery = targetPool.query.bind(targetPool);
  (targetPool as any).query = async function(...args: any[]) {
    const res = await (originalPoolQuery as any)(...args);
    if (res && Array.isArray(res.rows)) {
      for (let i = 0; i < res.rows.length; i++) {
        attachCamelCaseAliases(res.rows[i]);
      }
    }
    return res;
  };

  const originalConnect = targetPool.connect.bind(targetPool);
  (targetPool as any).connect = function(...args: any[]) {
    if (typeof args[0] === 'function') {
      const cb = args[0];
      return (originalConnect as any)((err: any, client: any, release: any) => {
        if (client && typeof client.query === 'function' && !(client as any).__camelCaseWrapped) {
          (client as any).__camelCaseWrapped = true;
          const origClientQuery = client.query.bind(client);
          client.query = async function(...qArgs: any[]) {
            const res = await (origClientQuery as any)(...qArgs);
            if (res && Array.isArray(res.rows)) {
              for (let i = 0; i < res.rows.length; i++) {
                attachCamelCaseAliases(res.rows[i]);
              }
            }
            return res;
          };
        }
        return cb(err, client, release);
      });
    }

    return (originalConnect as any)(...args).then((client: any) => {
      if (client && typeof client.query === 'function' && !(client as any).__camelCaseWrapped) {
        (client as any).__camelCaseWrapped = true;
        const origClientQuery = client.query.bind(client);
        client.query = async function(...qArgs: any[]) {
          const res = await (origClientQuery as any)(...qArgs);
          if (res && Array.isArray(res.rows)) {
            for (let i = 0; i < res.rows.length; i++) {
              attachCamelCaseAliases(res.rows[i]);
            }
          }
          return res;
        };
      }
      return client;
    });
  };
  return targetPool;
}

wrapPoolWithCamelCase(primaryPool);
if (replicaPool !== primaryPool) {
  wrapPoolWithCamelCase(replicaPool);
}

// Connection logging listeners
primaryPool.on('connect', () => {
  logger.info('Connected to PostgreSQL primary database');
});

primaryPool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL primary client', err);
});

if (replicaPool !== primaryPool) {
  replicaPool.on('connect', () => {
    logger.info('Connected to PostgreSQL replica database');
  });

  replicaPool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL replica client', err);
  });
}

export const db = {
  /**
   * Execute read-write queries or transactional locks on primary node
   */
  queryPrimary: async (text: string, params?: any[]): Promise<QueryResult> => {
    const start = Date.now();
    const res = await primaryPool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query on primary pool', { text, duration, rows: res.rowCount });
    return res;
  },

  /**
   * Execute read-only SELECT queries on replica pool, falling back to primary on error or pinned context
   */
  queryReplica: async (text: string, params?: any[]): Promise<QueryResult> => {
    const store = routingStore.getStore();
    if (store?.isPinnedToPrimary || replicaPool === primaryPool) {
      return db.queryPrimary(text, params);
    }

    const start = Date.now();
    try {
      const res = await replicaPool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query on replica pool', { text, duration, rows: res.rowCount });
      return res;
    } catch (err: any) {
      logger.warn('PostgreSQL replica query failed, falling back to primary pool', {
        error: err.message || String(err),
        text,
      });
      return db.queryPrimary(text, params);
    }
  },

  /**
   * Explicit transaction helper strictly bound to primary node
   */
  transaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await primaryPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export const query = (text: string, params?: any[]) => db.queryPrimary(text, params);
export const getClient = () => primaryPool.connect();
export const transaction = db.transaction;

export const closePools = async () => {
  await primaryPool.end();
  if (replicaPool !== primaryPool) {
    await replicaPool.end();
  }
};

export default primaryPool;
