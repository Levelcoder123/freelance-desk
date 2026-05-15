import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { invoiceQueue } from '../workers/invoiceWorker.js';

export const invoicesRouter = Router();
invoicesRouter.use(authenticate);

const invoiceSchema = z.object({
  client_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  invoice_number: z.string().min(1).max(50),
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']).default('draft'),
  amount: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  tax_rate: z.number().min(0).max(100).default(0),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(0),
    rate: z.number().min(0),
    amount: z.number().min(0),
  })).optional().default([]),
});

const updateSchema = invoiceSchema.partial();

// ── GET /invoices
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const { status, client_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.userId];
    let where = 'WHERE i.user_id=$1';

    if (status)    { params.push(status);    where += ` AND i.status=$${params.length}`; }
    if (client_id) { params.push(client_id); where += ` AND i.client_id=$${params.length}`; }
    if (search)    { params.push(`%${search}%`); where += ` AND (i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT i.*, c.name AS client_name, c.company AS client_company, p.name AS project_name
       FROM invoices i
       LEFT JOIN clients  c ON c.id = i.client_id
       LEFT JOIN projects p ON p.id = i.project_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const cntParams = params.slice(0, params.length - 2);
    const { rows: cr } = await query(
      `SELECT COUNT(*) FROM invoices i LEFT JOIN clients c ON c.id = i.client_id ${where}`,
      cntParams
    );

    res.json({ data: rows, meta: { total: parseInt(cr[0].count), page: +page, limit: +limit } });
  } catch (err) { next(err); }
});

// ── POST /invoices
invoicesRouter.post('/', validate(invoiceSchema), async (req, res, next) => {
  try {
    const {
      client_id, project_id, invoice_number, status, amount,
      currency, tax_rate, issue_date, due_date, notes, line_items,
    } = req.body;

    const { rows } = await query(
      `INSERT INTO invoices
         (user_id,client_id,project_id,invoice_number,status,amount,currency,tax_rate,issue_date,due_date,notes,line_items)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.userId, client_id, project_id, invoice_number, status, amount,
        currency, tax_rate, issue_date, due_date, notes, JSON.stringify(line_items)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /invoices/:id
invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT i.*, c.name AS client_name, c.email AS client_email,
              c.company AS client_company, c.address AS client_address,
              p.name AS project_name
       FROM invoices i
       LEFT JOIN clients  c ON c.id = i.client_id
       LEFT JOIN projects p ON p.id = i.project_id
       WHERE i.id=$1 AND i.user_id=$2`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /invoices/:id
invoicesRouter.patch('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const allowed = ['client_id', 'project_id', 'invoice_number', 'status', 'amount',
      'currency', 'tax_rate', 'issue_date', 'due_date', 'notes', 'line_items'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    // Auto-set paid_at when status → paid
    if (updates.status === 'paid') updates.paid_at = new Date().toISOString();
    if (updates.status && updates.status !== 'paid') updates.paid_at = null;

    // Serialize JSONB field
    if (updates.line_items !== undefined) {
      updates.line_items = JSON.stringify(updates.line_items)
    }

    const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
    const { rows } = await query(
      `UPDATE invoices SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.userId, ...Object.values(updates)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /invoices/:id
invoicesRouter.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM invoices WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Invoice not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

// ── POST /invoices/:id/send  (trigger email + Stripe payment link)
invoicesRouter.post('/:id/send', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT i.*, c.email AS client_email, c.name AS client_name
       FROM invoices i LEFT JOIN clients c ON c.id=i.client_id
       WHERE i.id=$1 AND i.user_id=$2`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });

    await invoiceQueue.add('send-invoice', { invoiceId: req.params.id });

    await query(`UPDATE invoices SET status='pending' WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Invoice queued for sending', invoice_id: req.params.id });
  } catch (err) { next(err); }
});