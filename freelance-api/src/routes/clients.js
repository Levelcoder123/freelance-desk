import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

export const clientsRouter = Router();
clientsRouter.use(authenticate);

// ── Schemas
const clientSchema = z.object({
  name:        z.string().min(1).max(255),
  company:     z.string().max(255).optional(),
  email:       z.string().email().optional().or(z.literal('')),
  phone:       z.string().max(50).optional(),
  address:     z.string().optional(),
  tags:        z.array(z.string()).optional().default([]),
  hourly_rate: z.number().min(0).optional(),
  status:      z.enum(['active','inactive']).default('active'),
  notes:       z.string().optional(),
});

const updateSchema = clientSchema.partial();

// ── GET /clients  (list + search)
clientsRouter.get('/', async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.userId];
    let where = 'WHERE c.user_id=$1';

    if (status) { params.push(status); where += ` AND c.status=$${params.length}`; }

    if (search) {
      params.push(search);
      where += ` AND to_tsvector('english', c.name || ' ' || COALESCE(c.company,'') || ' ' || COALESCE(c.email,''))
                 @@ plainto_tsquery('english', $${params.length})`;
    }

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT c.*,
              COUNT(i.id)                                          AS invoice_count,
              COALESCE(SUM(i.amount) FILTER (WHERE i.status='paid'), 0) AS total_earned
       FROM clients c
       LEFT JOIN invoices i ON i.client_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM clients c ${where}`, countParams
    );

    res.json({
      data: rows,
      meta: { total: parseInt(countRows[0].count), page: +page, limit: +limit },
    });
  } catch (err) { next(err); }
});

// ── POST /clients
clientsRouter.post('/', validate(clientSchema), async (req, res, next) => {
  try {
    const { name, company, email, phone, address, tags, hourly_rate, status, notes } = req.body;
    const { rows } = await query(
      `INSERT INTO clients(user_id,name,company,email,phone,address,tags,hourly_rate,status,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.userId, name, company, email, phone, address, tags, hourly_rate, status, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /clients/:id
clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.*,
              COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS invoices
       FROM clients c
       LEFT JOIN invoices i ON i.client_id = c.id
       WHERE c.id=$1 AND c.user_id=$2
       GROUP BY c.id`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /clients/:id
clientsRouter.patch('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const allowed = ['name','company','email','phone','address','tags','hourly_rate','status','notes'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
    const { rows } = await query(
      `UPDATE clients SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.userId, ...Object.values(updates)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /clients/:id
clientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM clients WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Client not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});