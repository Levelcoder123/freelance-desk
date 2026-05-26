import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { User } from '../types/index.js';

function mapUser(row: any): User {
    if (!row) return row;
    return {
        ...row,
        monthlyGoal: row.monthlyGoal ? parseFloat(row.monthlyGoal) : null,
        taxRate:     row.taxRate     ? parseFloat(row.taxRate)     : null,
        seTaxRate:   row.seTaxRate   ? parseFloat(row.seTaxRate)   : null,
    };
}

/**
 * Finds a user by their email address.
 */
export async function findUserByEmail(email: string) {
    const result = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      plan: users.plan,
      passwordHash: users.passwordHash
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
    
    return result[0] || null;
}

/**
 * Creates a new user record.
 */
export async function createUser({ fullName, email, passwordHash }: { fullName: string; email: string; passwordHash: string }) {
    const result = await db.insert(users)
        .values({
            fullName,
            email,
            passwordHash
        })
        .returning({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            plan: users.plan,
            createdAt: users.createdAt
        });
    return result[0];
}

/**
 * Retrieves a user by their ID with profile-related fields.
 */
export async function getUserById(id: string) {
    const result = await db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        plan: users.plan,
        monthlyGoal: users.monthlyGoal,
        taxRate: users.taxRate,
        seTaxRate: users.seTaxRate,
        timezone: users.timezone,
        createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
    
    return mapUser(result[0]) || null;
}

/**
 * Updates an existing user record.
 */
export async function updateUser(id: string, updates: Partial<User>) {
    const { id: _, createdAt: __, updatedAt: ___, passwordHash: ____, ...cleanUpdates } = updates as any;

    if (Object.keys(cleanUpdates).length === 0) return getUserById(id);

    const result = await db.update(users)
        .set({ ...cleanUpdates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            plan: users.plan,
            monthlyGoal: users.monthlyGoal,
            taxRate: users.taxRate,
            seTaxRate: users.seTaxRate,
            timezone: users.timezone
        });
    return mapUser(result[0]) || null;
}

/**
 * Updates a user's password hash.
 */
export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
    await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
}
