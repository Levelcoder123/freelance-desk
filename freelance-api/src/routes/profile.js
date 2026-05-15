import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

export const profileRouter = Router();
profileRouter.use(authenticate);

const updateProfileSchema = z.object({
    full_name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    monthly_goal: z.number().min(0).optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    se_tax_rate: z.number().min(0).max(100).optional(),
    timezone: z.string().max(50).optional(),
});

const changePasswordSchema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8),
});

// GET /profile
profileRouter.get('/', async (req, res, next) => {
    try {
        const { rows } = await query(
            `SELECT id, email, full_name, plan, monthly_goal, tax_rate, se_tax_rate, timezone, created_at
       FROM users WHERE id=$1`,
            [req.userId]
        );
        if (!rows[0]) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// PATCH /profile
profileRouter.patch('/', validate(updateProfileSchema), async (req, res, next) => {
    try {
        const allowed = ['full_name', 'email', 'monthly_goal', 'tax_rate', 'se_tax_rate', 'timezone'];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([k]) => allowed.includes(k))
        );
        if (!Object.keys(updates).length)
            return res.status(400).json({ error: 'Nothing to update' });

        // Check email uniqueness if changing email
        if (updates.email) {
            const { rows } = await query(
                'SELECT id FROM users WHERE email=$1 AND id!=$2',
                [updates.email, req.userId]
            );
            if (rows.length) return res.status(409).json({ error: 'Email already in use' });
        }

        const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 2}`).join(', ');
        const { rows } = await query(
            `UPDATE users SET ${fields} WHERE id=$1
       RETURNING id, email, full_name, plan, monthly_goal, tax_rate, se_tax_rate, timezone`,
            [req.userId, ...Object.values(updates)]
        );
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// POST /profile/change-password
profileRouter.post('/change-password', validate(changePasswordSchema), async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.userId]);
        if (!rows[0]) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

        const hash = await bcrypt.hash(new_password, 12);
        await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) { next(err); }
});
