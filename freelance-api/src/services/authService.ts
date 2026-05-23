import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database.js';
import { Tokens, RefreshToken } from '../types/index.js';

/**
 * Generates access and refresh tokens for a user.
 */
export function generateTokens(userId: string | number): Tokens {
  const access = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refresh = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
  return { access, refresh };
}

/**
 * Persists a refresh token hash in the database.
 */
export async function saveRefreshToken(userId: string | number, token: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES($1,$2,$3)',
    [userId, hash, expiresAt]
  );
}

/**
 * Revokes a specific refresh token by its hash.
 */
export async function revokeRefreshToken(hash: string): Promise<void> {
    await query('UPDATE refresh_tokens SET revoked=true WHERE token_hash=$1', [hash]);
}

/**
 * Revokes all refresh tokens belonging to a user.
 */
export async function revokeAllUserRefreshTokens(userId: string | number): Promise<void> {
    await query('UPDATE refresh_tokens SET revoked=true WHERE user_id=$1', [userId]);
}

/**
 * Finds a valid (not revoked and not expired) refresh token.
 */
export async function findValidRefreshToken(userId: string | number, hash: string): Promise<RefreshToken | null> {
    const { rows } = await query(
        `SELECT id, user_id, token_hash, revoked, expires_at, created_at FROM refresh_tokens
         WHERE user_id=$1 AND token_hash=$2 AND revoked=false AND expires_at > NOW()`,
        [userId, hash]
    );
    return rows[0] || null;
}

/**
 * Hashes a plain text password.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

/**
 * Compares a plain text password with its hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
