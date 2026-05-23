import pg from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  allowExitOnIdle: process.env.NODE_ENV === 'test',
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected DB pool error', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const getClient = () => pool.connect();

export const withTransaction = async <T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default pool;
