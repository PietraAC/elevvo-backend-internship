import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { database, closeDatabase } from '../src/lib/database.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationDirectory = path.join(projectRoot, 'migrations');

async function migrate(): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const filenames = (await readdir(migrationDirectory)).filter((filename) => filename.endsWith('.sql')).sort();

  for (const filename of filenames) {
    const applied = await database.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [filename]);
    if (applied.rowCount) {
      console.log(`skip ${filename}`);
      continue;
    }
    const sql = await readFile(path.join(migrationDirectory, filename), 'utf8');
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [filename]);
      await client.query('COMMIT');
      console.log(`apply ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

migrate()
  .then(() => console.log('Database migrations are current.'))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Migration failed.');
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
