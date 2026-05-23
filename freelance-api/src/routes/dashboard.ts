import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import * as dashboardService from '../services/dashboardService.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate as any);

// GET /dashboard  — single call, all stats the UI needs
dashboardRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await dashboardService.getDashboardData(req.userId);
    res.json(data);
  } catch (err) { next(err); }
});
