import pg from 'pg';
import { databaseUrlForEnvironment } from '../config/env.js';

const { Pool } = pg;

export const database = new Pool({
  connectionString: databaseUrlForEnvironment(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

database.on('error', () => {
  // Connection errors are mapped at the request boundary; secrets are never logged.
});

export async function databaseReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  await database.end();
}
