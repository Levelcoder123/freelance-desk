// tests/setup/globalSetup.js
import { execSync } from 'child_process';

export default async function () {
    // Run migrations against the test DB before the suite starts
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
        || process.env.DATABASE_URL
        || 'postgresql://postgres:postgres@localhost:5432/freelance_test';
    process.env.NODE_ENV = 'test';
    execSync('npx tsx src/db/migrate.ts', { stdio: 'inherit' });
}
