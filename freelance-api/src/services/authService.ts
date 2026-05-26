import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { refreshTokens } from '../db/schema.js';
import { Tokens } from '../types/index.js';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Generates access and refresh tokens for a user.
 */
export function generateTokens(userId: string): Tokens {
  const access = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    (process.env.JWT_SECRET as string) || 'secret',
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES as any) || '15m' }
  );
  const refresh = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    (process.env.JWT_REFRESH_SECRET as string) || 'refresh-secret',
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES as any) || '30d' }
  );
  return { access, refresh };
}

/**
 * Persists a refresh token hash in the database.
 */
export async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  await db.insert(refreshTokens).values({
      userId,
      tokenHash: hash,
      expiresAt
  });
}

/**
 * Revokes a specific refresh token by its hash.
 */
export async function revokeRefreshToken(hash: string): Promise<void> {
    await db.update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.tokenHash, hash));
}

/**
 * Revokes all refresh tokens belonging to a user.
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await db.update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.userId, userId));
}

/**
 * Finds a valid (not revoked and not expired) refresh token.
 */
export async function findValidRefreshToken(userId: string, hash: string) {
    const result = await db.select()
        .from(refreshTokens)
        .where(
            and(
                eq(refreshTokens.userId, userId),
                eq(refreshTokens.tokenHash, hash),
                eq(refreshTokens.revoked, false),
                gt(refreshTokens.expiresAt, new Date())
            )
        )
        .limit(1);
    
    return result[0] || null;
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
