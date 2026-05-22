import { query } from '../config/database.js';

/**
 * Finds a user by their email address.
 * @param {string} email 
 * @returns {Promise<Object|null>}
 */
export async function findUserByEmail(email) {
    const { rows } = await query(
        'SELECT id, full_name, email, plan, password_hash FROM users WHERE email=$1',
        [email]
    );
    return rows[0];
}

/**
 * Creates a new user record.
 * @param {Object} userData 
 * @returns {Promise<Object>}
 */
export async function createUser({ full_name, email, password_hash }) {
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
 * @param {string|number} id 
 * @returns {Promise<Object|null>}
 */
export async function getUserById(id) {
    const { rows } = await query(
        `SELECT id, email, full_name, plan, monthly_goal, tax_rate, se_tax_rate, timezone, created_at
         FROM users WHERE id=$1`,
        [id]
    );
    return rows[0];
}

/**
 * Updates an existing user record.
 * @param {string|number} id 
 * @param {Object} updates 
 * @returns {Promise<Object>}
 */
export async function updateUser(id, updates) {
    const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 2}`).join(', ');
    const { rows } = await query(
        `UPDATE users SET ${fields} WHERE id=$1
         RETURNING id, email, full_name, plan, monthly_goal, tax_rate, se_tax_rate, timezone`,
        [id, ...Object.values(updates)]
    );
    return rows[0];
}

/**
 * Updates a user's password hash.
 * @param {string|number} userId 
 * @param {string} passwordHash 
 * @returns {Promise<void>}
 */
export async function updatePassword(userId, passwordHash) {
    await query(
        'UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2',
        [passwordHash, userId]
    );
}
