import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as dashboardService from '../services/dashboardService.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// GET /dashboard  — single call, all stats the UI needs
dashboardRouter.get('/', async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData(req.userId);
    res.json(data);
  } catch (err) { next(err); }
});
