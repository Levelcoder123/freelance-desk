import { query } from '../config/database.js';
import { User } from '../types/index.js';

/**
 * Finds a user by their email address.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
    const { rows } = await query(
        'SELECT id, full_name, email, plan, password_hash FROM users WHERE email=$1',
        [email]
    );
    return rows[0] || null;
}

/**
 * Creates a new user record.
 */
export async function createUser({ full_name, email, password_hash }: { full_name: string; email: string; password_hash: string }): Promise<Partial<User>> {
    const { rows } = await query(
        `INSERT INTO users(full_name, email, password_hash)
         VALUES($1,$2,$3)
         RETURNING id, full_name, email, plan, created_at`,
        [full_name, email, password_hash]
    );
    return rows[0];
}

/**
 * Retrieves a user by their ID with profile-related fields.
 */
export async function getUserById(id: string): Promise<User | null> {
    const { rows } = await query(
        `SELECT id, email, full_name, plan, monthly_goal, tax_rate, se_tax_rate, timezone, created_at
         FROM users WHERE id=$1`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Updates an existing user record.
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const keys = Object.keys(updates);
    if (keys.length === 0) return getUserById(id);

    const fields = keys.map((k, i) => `${k}=$${i + 2}`).join(', ');
    const { rows } = await query(
        `UPDATE users SET ${fields} WHERE id=$1
         RETURNING id, email, full_name, plan, monthly_goal, tax_rate, se_tax_rate, timezone`,
        [id, ...Object.values(updates)]
    );
    return rows[0] || null;
}

/**
 * Updates a user's password hash.
 */
export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
    await query(
        'UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2',
        [passwordHash, userId]
    );
}
