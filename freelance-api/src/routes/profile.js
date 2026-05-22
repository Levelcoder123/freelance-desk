import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import * as profileValidation from '../validations/profileValidation.js';

export const profileRouter = Router();
profileRouter.use(authenticate);

// GET /profile
profileRouter.get('/', async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) { next(err); }
});

// PATCH /profile
profileRouter.patch('/', validate(profileValidation.updateProfileSchema), async (req, res, next) => {
    try {
        const allowed = ['full_name', 'email', 'monthly_goal', 'tax_rate', 'se_tax_rate', 'timezone'];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([k]) => allowed.includes(k))
        );
        if (!Object.keys(updates).length)
            return res.status(400).json({ error: 'Nothing to update' });

        // Check email uniqueness if changing email
        if (updates.email) {
            const existing = await userService.findUserByEmail(updates.email);
            if (existing && existing.id !== req.userId) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        const user = await userService.updateUser(req.userId, updates);
        res.json(user);
    } catch (err) { next(err); }
});

// POST /profile/change-password
profileRouter.post('/change-password', validate(profileValidation.changePasswordSchema), async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        const user = await userService.findUserByEmail((await userService.getUserById(req.userId)).email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await authService.comparePassword(current_password, user.password_hash);
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

        const hash = await authService.hashPassword(new_password);
        await userService.updatePassword(req.userId, hash);

        res.json({ message: 'Password updated successfully' });
    } catch (err) { next(err); }
});
