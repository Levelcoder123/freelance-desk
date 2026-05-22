// tests/setup/globalTeardown.js
import { query, pool } from '../../src/config/database.js';

export default async function () {
    // Wipe all tables after the full suite
    await query(`TRUNCATE users, clients, projects, invoices, expenses,
               refresh_tokens RESTART IDENTITY CASCADE`);
    await pool.end();
}
