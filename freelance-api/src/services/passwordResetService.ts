import crypto from 'crypto';
import { db } from '../config/database.js';
import { passwordResetTokens } from '../db/schema.js';
import { eq, and, gt, isNull } from 'drizzle-orm';

const RESET_TOKEN_TTL_HOURS = 1;

/**
 * Creates a unique password reset token for a user.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
        userId,
        token,
        expiresAt
    });
    
    return token;
}

/**
 * Retrieves a valid (unused and not expired) password reset token.
 */
export async function getValidPasswordResetToken(token: string) {
    const result = await db.select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId
    })
    .from(passwordResetTokens)
    .where(
        and(
            eq(passwordResetTokens.token, token),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date())
        )
    )
    .limit(1);

    return result[0] || null;
}

/**
 * Marks a password reset token as used.
 */
export async function usePasswordResetToken(tokenId: string): Promise<void> {
    await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, tokenId));
}

/**
 * Revokes all previous reset tokens for a user by marking them as used.
 */
export async function revokePreviousResetTokens(userId: string): Promise<void> {
    await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
            and(
                eq(passwordResetTokens.userId, userId),
                isNull(passwordResetTokens.usedAt)
            )
        );
}
