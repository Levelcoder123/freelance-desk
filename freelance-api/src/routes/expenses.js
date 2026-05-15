import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

export const expensesRouter = Router();
expensesRouter.use(authenticate);

const CATEGORIES = ['Software','Hardware','Marketing','Education','Travel','Office','Other'];

const expenseSchema = z.object({
  description:  z.string().min(1).max(255),
  amount:       z.number().min(0),
  currency:     z.string().length(3).default('USD'),
  category:     z.enum(CATEGORIES).default('Other'),
  expense_date: z.string().optional(),
  notes:        z.string().optional(),
});

// GET /expenses
expensesRouter.get('/', async (req, res, next) => {
  try {
    const { category, year, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.userId];
    let where = 'WHERE user_id=$1';

    if (category) { params.push(category);      where += ` AND category=$${params.length}`; }
    if (year)     { params.push(year);           where += ` AND EXTRACT(YEAR FROM expense_date)=$${params.length}`; }
    if (search)   { params.push(`%${search}%`); where += ` AND description ILIKE $${params.length}`; }

    const cntParams = [...params];
    params.push(limit, offset);

    const { rows } = await query(
      `SELECT * FROM expenses ${where}
       ORDER BY expense_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: cr } = await query(
      `SELECT COUNT(*) FROM expenses ${where}`,
      cntParams
    );

    const { rows: summary } = await query(
      `SELECT category, SUM(amount) AS total, COUNT(*) AS count
       FROM expenses WHERE user_id=$1
       GROUP BY category ORDER BY total DESC`,
      [req.userId]
    );

    const total = summary.reduce((s, r) => s + parseFloat(r.total), 0);
    res.json({
      data: rows,
      meta: { total: parseInt(cr[0].count), page: +page, limit: +limit },
      summary,
      total,
    });
  } catch (err) { next(err); }
});

// POST /expenses
expensesRouter.post('/', validate(expenseSchema), async (req, res, next) => {
  try {
    const { description, amount, currency, category, expense_date, notes } = req.body;
    const { rows } = await query(
      `INSERT INTO expenses(user_id,description,amount,currency,category,expense_date,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.userId, description, amount, currency, category, expense_date || new Date(), notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /expenses/:id
expensesRouter.patch('/:id', validate(expenseSchema.partial()), async (req, res, next) => {
  try {
    const allowed = ['description','amount','currency','category','expense_date','notes'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
    const { rows } = await query(
      `UPDATE expenses SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.userId, ...Object.values(updates)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Expense not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /expenses/:id
expensesRouter.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM expenses WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Expense not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});