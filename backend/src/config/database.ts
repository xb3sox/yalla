import { Pool, PoolConfig } from 'pg';
import config from './index';
import logger from '../utils/logger';

const poolConfig: PoolConfig = {
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
  query_timeout: 10000,
  ssl:
    config.env === 'production' && !config.database.url.includes('localhost')
      ? { rejectUnauthorized: config.database.sslRejectUnauthorized !== false }
      : undefined,
};

const pool = new Pool(poolConfig);

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

const originalPoolQuery = pool.query.bind(pool);
(pool as any).query = async function(...args: any[]) {
  const res = await (originalPoolQuery as any)(...args);
  if (res && Array.isArray(res.rows)) {
    for (let i = 0; i < res.rows.length; i++) {
      attachCamelCaseAliases(res.rows[i]);
    }
  }
  return res;
};

const originalConnect = pool.connect.bind(pool);
(pool as any).connect = function(...args: any[]) {
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

// Test connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = () => pool.connect();

export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
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
};

export default pool;
