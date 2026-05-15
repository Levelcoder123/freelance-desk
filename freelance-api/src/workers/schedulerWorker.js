// src/workers/schedulerWorker.js
import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { query } from '../config/database.js';
import { sendWeeklySummary } from '../services/emailService.js';

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

    console.log('[scheduler] jobs registered');
}

const worker = new Worker(
    'scheduler',
    async (job) => {
        switch (job.name) {

            case 'mark-overdue': {
                const { rowCount } = await query(`
                    UPDATE invoices
                    SET status = 'overdue'
                    WHERE status = 'pending'
                      AND due_date < CURRENT_DATE
                `);
                console.log(`[scheduler] marked ${rowCount} invoice(s) overdue`);
                break;
            }

            case 'weekly-summary': {
                const { rows: users } = await query(`
                    SELECT u.id, u.full_name, u.email
                    FROM users u
                    WHERE EXISTS (
                        SELECT 1 FROM invoices i
                        WHERE i.user_id = u.id
                          AND i.created_at >= NOW() - INTERVAL '7 days'
                    )
                `);

                let sent = 0;
                for (const user of users) {
                    try {
                        const { rows: [stats] } = await query(`
                            SELECT
                                COALESCE(SUM(amount) FILTER (WHERE status = 'paid'
                                    AND paid_at >= NOW() - INTERVAL '7 days'), 0)       AS earned,
                                COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending,
                                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS invoices_sent,
                                (
                                    SELECT c.name FROM clients c
                                    JOIN invoices i2 ON i2.client_id = c.id
                                    WHERE i2.user_id = u.id AND i2.status = 'paid'
                                      AND i2.paid_at >= NOW() - INTERVAL '7 days'
                                    GROUP BY c.name
                                    ORDER BY SUM(i2.amount) DESC
                                    LIMIT 1
                                ) AS top_client
                            FROM invoices
                            WHERE user_id = $1
                        `, [user.id]);

                        await sendWeeklySummary({
                            to: user.email,
                            name: user.full_name,
                            stats: {
                                earned: parseFloat(stats.earned),
                                pending: parseFloat(stats.pending),
                                invoicesSent: parseInt(stats.invoices_sent),
                                topClient: stats.top_client ?? null,
                            },
                        });
                        sent++;
                    } catch (err) {
                        console.error(`[scheduler] failed for ${user.email}:`, err.message);
                    }
                }

                console.log(`[scheduler] weekly summaries sent to ${sent}/${users.length} user(s)`);
                break;
            }

            case 'cleanup-tokens': {
                // Clean both tables
                const { rowCount: resetCount } = await query(`
                    DELETE FROM password_reset_tokens
                    WHERE expires_at < NOW() OR used = true
                `);
                const { rowCount: refreshCount } = await query(`
                    DELETE FROM refresh_tokens
                    WHERE revoked = true OR expires_at < NOW()
                `);
                console.log(`[scheduler] cleaned ${resetCount} reset token(s), ${refreshCount} refresh token(s)`);
                break;
            }

            default:
                console.warn(`[scheduler] unknown job: ${job.name}`);
        }
    },
    { connection: makeRedisConnection() } // separate connection from the Queue
);

worker.on('failed', (job, err) => {
    console.error(`[scheduler] job ${job?.id} (${job?.name}) failed:`, err.message);
});

worker.on('error', (err) => {
    console.error('[scheduler] worker error:', err.message);
});

console.log('[scheduler] worker running');
