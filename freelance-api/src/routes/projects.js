import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

export const projectsRouter = Router();
projectsRouter.use(authenticate);

const projectSchema = z.object({
  client_id:   z.string().uuid().optional(),
  name:        z.string().min(1).max(255),
  description: z.string().optional(),
  status:      z.enum(['active','completed','paused']).default('active'),
  priority:    z.enum(['low','medium','high']).default('medium'),
  progress:    z.number().int().min(0).max(100).default(0),
  deadline:    z.string().optional(),
  budget:      z.number().min(0).optional(),
});

// GET /projects
projectsRouter.get('/', async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.userId];
    let where = 'WHERE p.user_id=$1';

    if (status)   { params.push(status);        where += ` AND p.status=$${params.length}`; }
    if (priority) { params.push(priority);       where += ` AND p.priority=$${params.length}`; }
    if (search)   { params.push(`%${search}%`); where += ` AND (p.name ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }

    const cntParams = [...params];
    params.push(limit, offset);

    const { rows } = await query(
      `SELECT p.*, c.name AS client_name
       FROM projects p LEFT JOIN clients c ON c.id=p.client_id
       ${where}
       ORDER BY p.deadline ASC NULLS LAST
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: cr } = await query(
      `SELECT COUNT(*) FROM projects p LEFT JOIN clients c ON c.id=p.client_id ${where}`,
      cntParams
    );

    res.json({ data: rows, meta: { total: parseInt(cr[0].count), page: +page, limit: +limit } });
  } catch (err) { next(err); }
});

// POST /projects
projectsRouter.post('/', validate(projectSchema), async (req, res, next) => {
  try {
    const { client_id, name, description, status, priority, progress, deadline, budget } = req.body;
    const { rows } = await query(
      `INSERT INTO projects(user_id,client_id,name,description,status,priority,progress,deadline,budget)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, client_id, name, description, status, priority, progress, deadline, budget]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /projects/:id
projectsRouter.patch('/:id', validate(projectSchema.partial()), async (req, res, next) => {
  try {
    const allowed = ['client_id','name','description','status','priority','progress','deadline','budget'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
    const { rows } = await query(
      `UPDATE projects SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.userId, ...Object.values(updates)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /projects/:id
projectsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Project not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});