// src/workers/schedulerWorker.ts
import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from '../config/database.js';
import { invoices, users, passwordResetTokens, refreshTokens } from '../db/schema.js';
import { eq, and, lt, sql, isNull, or } from 'drizzle-orm';
import { sendWeeklySummary } from '../services/emailService.js';
import logger from '../utils/logger.js';

// BullMQ needs separate connections for Queue and Worker
const makeRedisConnection = () =>
    new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
        maxRetriesPerRequest: null, // required by BullMQ
    });

export const schedulerQueue = new Queue('scheduler', {
    connection: makeRedisConnection(),
});

export async function registerScheduledJobs() {
    await schedulerQueue.add(
        'mark-overdue',
        {},
        {
            repeat: { pattern: '0 * * * *' },
            jobId: 'mark-overdue',
            removeOnComplete: true,
            removeOnFail: { count: 50 },
        }
    );

    await schedulerQueue.add(
        'weekly-summary',
        {},
        {
            repeat: { pattern: '0 8 * * 1' },
            jobId: 'weekly-summary',
            removeOnComplete: true,
            removeOnFail: { count: 50 },
        }
    );

    await schedulerQueue.add(
        'cleanup-tokens',
        {},
        {
            repeat: { pattern: '0 3 * * *' },
            jobId: 'cleanup-tokens',
            removeOnComplete: true,
            removeOnFail: { count: 50 },
        }
    );

    logger.info('[scheduler] jobs registered');
}

const worker = new Worker(
    'scheduler',
    async (job) => {
        switch (job.name) {

            case 'mark-overdue': {
                const result = await db.update(invoices)
                    .set({ status: 'overdue' })
                    .where(
                        and(
                            eq(invoices.status, 'pending'),
                            lt(invoices.dueDate, sql`CURRENT_DATE`)
                        )
                    );
                // rowCount is not directly on result in Drizzle the same way, but it's fine
                logger.info(`[scheduler] ran mark-overdue`);
                break;
            }

            case 'weekly-summary': {
                // Find users who had invoice activity in the last 7 days
                const recentUsers = await db.select({
                    id: users.id,
                    fullName: users.fullName,
                    email: users.email
                })
                .from(users)
                .where(
                    sql`EXISTS (
                        SELECT 1 FROM invoices i
                        WHERE i.user_id = ${users.id}
                          AND i.created_at >= NOW() - INTERVAL '7 days'
                    )`
                );

                let sent = 0;
                for (const user of recentUsers) {
                    try {
                        const statsResult = await db.execute(sql`
                            SELECT
                                COALESCE(SUM(amount) FILTER (WHERE status = 'paid'
                                    AND paid_at >= NOW() - INTERVAL '7 days'), 0)::float       AS earned,
                                COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::float AS pending,
                                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS invoices_sent,
                                (
                                    SELECT c.name FROM clients c
                                    JOIN invoices i2 ON i2.client_id = c.id
                                    WHERE i2.user_id = ${user.id} AND i2.status = 'paid'
                                      AND i2.paid_at >= NOW() - INTERVAL '7 days'
                                    GROUP BY c.name
                                    ORDER BY SUM(i2.amount) DESC
                                    LIMIT 1
                                ) AS top_client
                            FROM invoices
                            WHERE user_id = ${user.id}
                        `);

                        const stats = statsResult.rows[0] as any;

                        await sendWeeklySummary({
                            to: user.email,
                            name: user.fullName,
                            stats: {
                                earned: stats.earned,
                                pending: stats.pending,
                                invoicesSent: stats.invoices_sent,
                                topClient: stats.top_client ?? null,
                            },
                        });
                        sent++;
                    } catch (err: any) {
                        logger.error(`[scheduler] failed for ${user.email}`, err.message);
                    }
                }

                logger.info(`[scheduler] weekly summaries sent to ${sent}/${recentUsers.length} user(s)`);
                break;
            }

            case 'cleanup-tokens': {
                await db.delete(passwordResetTokens)
                    .where(
                        or(
                            lt(passwordResetTokens.expiresAt, new Date()),
                            sql`used_at IS NOT NULL`
                        )
                    );
                
                await db.delete(refreshTokens)
                    .where(
                        or(
                            eq(refreshTokens.revoked, true),
                            lt(refreshTokens.expiresAt, new Date())
                        )
                    );
                
                logger.info(`[scheduler] cleaned up tokens`);
                break;
            }

            default:
                logger.warn(`[scheduler] unknown job: ${job.name}`);
        }
    },
    { connection: makeRedisConnection() }
);

worker.on('failed', (job, err) => {
    logger.error(`[scheduler] job ${job?.id} (${job?.name}) failed`, err.message);
});

worker.on('error', (err) => {
    logger.error('[scheduler] worker error', err.message);
});

logger.info('[scheduler] worker running');
