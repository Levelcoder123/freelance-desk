import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import logger from './utils/logger.js';

import { authRouter } from './routes/auth.js';
import { clientsRouter } from './routes/clients.js';
import { invoicesRouter } from './routes/invoices.js';
import { profileRouter } from './routes/profile.js';
import { projectsRouter } from './routes/projects.js';
import { expensesRouter } from './routes/expenses.js';
import { dashboardRouter } from './routes/dashboard.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

import { constructWebhookEvent } from './services/stripeService.js';
import { db } from './config/database.js';
import { invoices } from './db/schema.js';
import { eq, and, ne, sql } from 'drizzle-orm';

import { registerScheduledJobs } from './workers/schedulerWorker.js';
import { confirmationQueue } from './workers/invoiceWorker.js';

const app = express();
const PORT = process.env.PORT || 3000;
const V = `/api/${process.env.API_VERSION || 'v1'}`;

// Raw body needed for Stripe signature verification
app.post(
    `${V}/webhooks/stripe`,
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'] as string;
        let event;
        try {
            event = constructWebhookEvent(req.body, sig);
        } catch (err: any) {
            logger.error('Stripe webhook signature failed', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'payment_intent.succeeded' ||
            event.type === 'checkout.session.completed') {
            const meta = (event.data.object as any).metadata || {};
            if (meta.invoice_id) {
                const result = await db.update(invoices)
                    .set({
                        status: 'paid',
                        paidAt: new Date(),
                        stripePaymentLink: null
                    })
                    .where(
                        and(
                            eq(invoices.id, meta.invoice_id),
                            ne(invoices.status, 'paid')
                        )
                    )
                    .returning({ id: invoices.id });

                if (result.length > 0) {
                    logger.info(`Invoice ${meta.invoice_id} marked paid via Stripe webhook`);

                    await confirmationQueue.add('send-confirmation', {
                        invoiceId: meta.invoice_id
                    });
                } else {
                    logger.info(`Invoice ${meta.invoice_id} already paid (skipping queue)`);
                }
            }
        }

        return res.json({ received: true });
    }
);

// ── Security & parsing
app.use(helmet());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : (true as any),
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check
app.get('/health', (_: Request, res: Response) => res.json({ status: 'ok', ts: new Date() }));

// ── Global rate limiter
app.use(`${V}`, rateLimiter);

// ── Routes
app.use(`${V}/auth`, authRouter);
app.use(`${V}/clients`, clientsRouter);
app.use(`${V}/invoices`, invoicesRouter);
app.use(`${V}/profile`, profileRouter);
app.use(`${V}/projects`, projectsRouter);
app.use(`${V}/expenses`, expensesRouter);
app.use(`${V}/dashboard`, dashboardRouter);

// ── 404
app.use((_: Request, res: Response) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler (must be last)
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
    app.listen(PORT, () => logger.info(`API running on :${PORT}`));
    registerScheduledJobs().catch(err => logger.error('Failed to register scheduled jobs', err));
}

export default app;
