// src/db/migrate.js
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query, pool } from '../config/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('▶ Running migrations…');

  // 1. Create migrations tracking table if it doesn't exist
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        SERIAL PRIMARY KEY,
      filename  TEXT    NOT NULL UNIQUE,
      run_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await query(
      `SELECT filename FROM _migrations WHERE filename = $1`,
      [file]
    );

    if (rows.length > 0) {
      console.log(`  ✓ ${file} already applied — skipping`);
      continue;
    }

    console.log(`  → Applying ${file}`);
    await query(readFileSync(join(migrationsDir, file), 'utf8'));
    await query(`INSERT INTO _migrations (filename) VALUES ($1)`, [file]);
    console.log(`  ✓ ${file} applied`);
  }

  console.log('✅ Migrations complete');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
