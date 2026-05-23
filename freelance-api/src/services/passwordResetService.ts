import crypto from 'crypto';
import { query } from '../config/database.js';

const RESET_TOKEN_TTL_HOURS = 1;

interface PasswordResetToken {
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
    used_at: Date | null;
}

/**
 * Creates a unique password reset token for a user.
 */
export async function createPasswordResetToken(userId: string | number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, token, expiresAt]
    );
    return token;
}

/**
 * Retrieves a valid (unused and not expired) password reset token.
 */
export async function getValidPasswordResetToken(token: string): Promise<Partial<PasswordResetToken> | null> {
    const { rows } = await query(
        `SELECT id, user_id
         FROM password_reset_tokens
         WHERE token = $1
           AND used_at IS NULL
           AND expires_at > NOW()`,
        [token]
    );
    return rows[0] || null;
}

/**
 * Marks a password reset token as used.
 */
export async function usePasswordResetToken(tokenId: string): Promise<void> {
    await query(
        'UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1',
        [tokenId]
    );
}

/**
 * Revokes all previous reset tokens for a user by marking them as used.
 */
export async function revokePreviousResetTokens(userId: string | number): Promise<void> {
    await query(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE user_id = $1 AND used_at IS NULL`,
        [userId]
    );
}
