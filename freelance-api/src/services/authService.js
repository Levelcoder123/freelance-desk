import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database.js';

/**
 * Generates access and refresh tokens for a user.
 * @param {string|number} userId 
 * @returns {Object} { access, refresh }
 */
export function generateTokens(userId) {
  const access = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refresh = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
  return { access, refresh };
}

/**
 * Persists a refresh token hash in the database.
 * @param {string|number} userId 
 * @param {string} token 
 * @returns {Promise<void>}
 */
export async function saveRefreshToken(userId, token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES($1,$2,$3)',
    [userId, hash, expiresAt]
  );
}

/**
 * Revokes a specific refresh token by its hash.
 * @param {string} hash 
 * @returns {Promise<void>}
 */
export async function revokeRefreshToken(hash) {
    await query('UPDATE refresh_tokens SET revoked=true WHERE token_hash=$1', [hash]);
}

/**
 * Revokes all refresh tokens belonging to a user.
 * @param {string|number} userId 
 * @returns {Promise<void>}
 */
export async function revokeAllUserRefreshTokens(userId) {
    await query('UPDATE refresh_tokens SET revoked=true WHERE user_id=$1', [userId]);
}

/**
 * Finds a valid (not revoked and not expired) refresh token.
 * @param {string|number} userId 
 * @param {string} hash 
 * @returns {Promise<Object|null>}
 */
export async function findValidRefreshToken(userId, hash) {
    const { rows } = await query(
        `SELECT id FROM refresh_tokens
         WHERE user_id=$1 AND token_hash=$2 AND revoked=false AND expires_at > NOW()`,
        [userId, hash]
    );
    return rows[0];
}

/**
 * Hashes a plain text password.
 * @param {string} password 
 * @returns {Promise<string>} The hashed password.
 */
export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

/**
 * Compares a plain text password with its hash.
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
