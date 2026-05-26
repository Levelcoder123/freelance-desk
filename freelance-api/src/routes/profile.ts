import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import * as profileValidation from '../validations/profileValidation.js';
import { User } from '../types/index.js';

export const profileRouter = Router();
profileRouter.use(authenticate as any);

// GET /profile
profileRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const user = await userService.getUserById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) { next(err); }
});

// PATCH /profile
profileRouter.patch('/', validate(profileValidation.updateProfileSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const allowed = ['fullName', 'email', 'monthlyGoal', 'taxRate', 'seTaxRate', 'timezone'];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([k]) => allowed.includes(k))
        );
        if (!Object.keys(updates).length)
            return res.status(400).json({ error: 'Nothing to update' });

        // Check email uniqueness if changing email
        if (updates.email && typeof updates.email === 'string') {
            const existing = await userService.findUserByEmail(updates.email);
            if (existing && existing.id !== req.userId) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        const user = await userService.updateUser(req.userId, updates as Partial<User>);
        res.json(user);
    } catch (err) { next(err); }
});

// POST /profile/change-password
profileRouter.post('/change-password', validate(profileValidation.changePasswordSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const { current_password, new_password } = req.body;

        const profile = await userService.getUserById(req.userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });

        const user = await userService.findUserByEmail(profile.email);
        if (!user || !user.passwordHash) return res.status(404).json({ error: 'User not found' });

        const valid = await authService.comparePassword(current_password, user.passwordHash);
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

        const hash = await authService.hashPassword(new_password);
        await userService.updatePassword(req.userId, hash);

        res.json({ message: 'Password updated successfully' });
    } catch (err) { next(err); }
});
